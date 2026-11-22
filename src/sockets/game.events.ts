import { Server, Socket } from 'socket.io';
import { GAME_CONSTANTS } from '../constants/game.constants.js';
import {
  startGame,
  getPublicState,
  getPlayerHand,
  drawCard,
  isPlayersTurn,
  endTurn,
  playCard,
  getGame,
  discardCards,
  clearGame,
} from '../services/game.service.js';
import { logger } from '../utils/logger.js';
import { getRooms, setRoomInProgress } from '../services/room.service.js';
import { wsEmitter } from '../ws/emitter.js';
import {
  PlayCardTarget,
  PlayerHandPayload,
  TransplantTarget,
  ContagionTarget,
  MedicalErrorTarget,
  GameState,
  OrganOnBoard,
  AnyPlayTarget,
  HistoryEntry,
} from '../interfaces/Game.interface.js';
import { GAME_ERRORS } from '../constants/error.constants.js';
import { EMOTES } from '../constants/emote.constants.js';
import { Card, CardKind, TreatmentSubtype } from '../interfaces/Card.interface.js';
import { describeCard, describeOrganLabel } from '../utils/card-label.utils.js';
import { pushHistoryEntry } from '../utils/history.utils.js';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const addHistoryEntry = (roomId: string, entry: HistoryEntry | string | null | undefined) => {
  if (!entry) return;
  const game = getGame(roomId);
  if (!game) return;
  pushHistoryEntry(game, entry);
};

const getPlayerName = (game: GameState | undefined, playerId?: string | null) => {
  if (!game || !playerId) return 'Jugador';
  const inPrivate = game.players.find(p => p.player.id === playerId);
  if (inPrivate) return inPrivate.player.name;
  const inPublic = game.public.players.find(p => p.player.id === playerId);
  if (inPublic) return inPublic.player.name;
  return 'Jugador';
};

const findOrgan = (
  game: GameState | undefined,
  playerId?: string,
  organId?: string
): OrganOnBoard | null => {
  if (!game || !playerId || !organId) return null;
  const targetPlayer = game.public.players.find(p => p.player.id === playerId);
  if (!targetPlayer) return null;
  return targetPlayer.board.find(o => o.id === organId) ?? null;
};

const isPlayCardTarget = (value: any): value is PlayCardTarget => {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.playerId === 'string' &&
    typeof value.organId === 'string'
  );
};

const isTransplantTarget = (value: any): value is TransplantTarget => {
  return (
    value && typeof value === 'object' && isPlayCardTarget(value.a) && isPlayCardTarget(value.b)
  );
};

const isPlayerOnlyTarget = (value: any): value is MedicalErrorTarget => {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.playerId === 'string' &&
    (!('organId' in value) || !value.organId)
  );
};

const describeTargetSuffix = (
  game: GameState | undefined,
  card: Card | null | undefined,
  target: any
) => {
  if (!target) {
    if (card?.kind === CardKind.Treatment && card.subtype === TreatmentSubtype.Gloves) {
      return ' → todos descartan';
    }
    return '';
  }

  if (Array.isArray(target)) {
    const contagionTargets = target as ContagionTarget[];
    if (!contagionTargets.length) return ' → contagio';
    const affectedPlayers = Array.from(
      new Set(contagionTargets.map(t => getPlayerName(game, t.toPlayerId)).filter(Boolean))
    );
    if (affectedPlayers.length) {
      return ` → contagio a ${affectedPlayers.join(', ')}`;
    }
    return ' → contagio';
  }

  if (isTransplantTarget(target)) {
    const nameA = getPlayerName(game, target.a.playerId);
    const nameB = getPlayerName(game, target.b.playerId);
    const organA = describeOrganLabel(findOrgan(game, target.a.playerId, target.a.organId));
    const organB = describeOrganLabel(findOrgan(game, target.b.playerId, target.b.organId));
    const detailA = organA ? ` (${organA})` : '';
    const detailB = organB ? ` (${organB})` : '';
    return ` entre ${nameA}${detailA} y ${nameB}${detailB}`;
  }

  if (isPlayCardTarget(target)) {
    const targetPlayer = getPlayerName(game, target.playerId);
    const organ = findOrgan(game, target.playerId, target.organId);
    const organLabel = describeOrganLabel(organ);
    if (organLabel) {
      return ` sobre ${organLabel} de ${targetPlayer}`;
    }
    return ` sobre ${targetPlayer}`;
  }

  if (isPlayerOnlyTarget(target)) {
    const targetPlayer = getPlayerName(game, target.playerId);
    return ` a ${targetPlayer}`;
  }

  return '';
};

const findCardInGame = (game: GameState | undefined, cardId: string | undefined): Card | null => {
  if (!game || !cardId) return null;

  for (const ps of game.players) {
    const fromHand = ps.hand.find(c => c.id === cardId);
    if (fromHand) return fromHand;
  }

  for (const pub of game.public.players) {
    for (const organ of pub.board) {
      if (organ.id === cardId) {
        return { id: organ.id, kind: CardKind.Organ, color: organ.color };
      }
      const attached = organ.attached.find(c => c.id === cardId);
      if (attached) return attached;
    }
  }

  const fromDiscard = game.discard.find(c => c.id === cardId);
  if (fromDiscard) return fromDiscard;

  return null;
};

const buildPlayCardHistoryEntry = (
  game: GameState | undefined,
  playerId: string,
  card: Card | null,
  target: any
): HistoryEntry => {
  const playerName = getPlayerName(game, playerId);
  const cardLabel = describeCard(card);
  const verb = card?.kind === CardKind.Treatment ? 'usó' : 'jugó';
  const suffix = describeTargetSuffix(game, card, target);
  return {
    player: playerName,
    action: verb,
    cardName: cardLabel,
    cardColor: card && 'color' in card ? card.color : undefined,
    target: suffix || ''
  };
};

const registerGameEvents = (io: Server, socket: Socket) => {
  socket.on(GAME_CONSTANTS.GAME_START, ({ roomId }) => {
    logger.info(`${GAME_CONSTANTS.GAME_START} - roomId=${roomId}`);

    const room = getRooms().find(r => r.id === roomId);
    if (!room) return;

    // 🔒 Solo host puede iniciar
    const requesterId = socket.data?.playerId;
    if (!requesterId || room.hostId !== requesterId) {
      logger.warn(`Non-host tried to start game in room ${roomId} (requester=${requesterId})`);
      return;
    }

    const players = room.players;
    if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
      logger.error(`${GAME_CONSTANTS.GAME_ERROR} -> ${GAME_ERRORS.NUMBER_PLAYERS.message}`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NUMBER_PLAYERS);
      return;
    }

    startGame(roomId, players, room.config);
    setRoomInProgress(roomId, true);
    wsEmitter.emitRoomsList();
    addHistoryEntry(roomId, 'Comienza la partida');

    // Estado público inicial
    const publicState = getPublicState(roomId);
    // notificar a todos los de la sala que la partida empezó
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STARTED, publicState);

    // Mano privada: enviamos a cada jugador por su socketId
    for (const pl of players) {
      if (!pl.socketId) {
        logger.warn(`[game:start] Player ${pl.id} missing socketId when sending hand`);
        continue; // seguridad
      }
      const hand = getPlayerHand(roomId, pl.id) || [];

      const payload: PlayerHandPayload = { roomId, playerId: pl.id, hand };
      io.to(pl.socketId).emit(GAME_CONSTANTS.GAME_HAND, payload);
    }

    logger.info(`${GAME_CONSTANTS.GAME_STARTED} - roomId=${roomId}`);
  });

  socket.on(GAME_CONSTANTS.GAME_GET_STATE, ({ roomId }) => {
    const publicState = getPublicState(roomId);
    socket.emit(GAME_CONSTANTS.GAME_STATE, publicState);
  });

  // robar carta
  socket.on(GAME_CONSTANTS.GAME_DRAW, ({ roomId }: { roomId: string }) => {
    const playerId = socket.data?.playerId as string | undefined;

    if (!playerId) {
      logger.warn(`${GAME_CONSTANTS.GAME_ERROR} Jugador no identificado`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.PLAYER_NOT_IDENTIFIED);
      return;
    }

    const room = getRooms().find(r => r.id === roomId);
    if (!room) {
      logger.warn(`${GAME_CONSTANTS.GAME_ERROR} Sala no existe`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.ROOM_NOT_FOUND);
      return;
    }

    const playerInRoom = room.players.some(p => p.id === playerId);
    if (!playerInRoom) {
      logger.warn(`${GAME_CONSTANTS.GAME_ERROR} No perteneces a esta sala`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_IN_ROOM);
      return;
    }

    const state = getPublicState(roomId);
    if (!state) {
      logger.warn(`${GAME_CONSTANTS.GAME_ERROR} Partida no encontrada`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.GAME_NOT_FOUND);
      return;
    }

    if (!isPlayersTurn(roomId, playerId)) {
      logger.warn(`[game:draw] Jugador ${playerId} intentó robar fuera de turno`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_YOUR_TURN);
      return;
    }

    const result = drawCard(roomId, playerId);
    if (!result.success) {
      socket.emit(GAME_CONSTANTS.GAME_ERROR, result.error);
      return;
    }

    const gameAfterDraw = getGame(roomId);
    const drawerName = getPlayerName(gameAfterDraw, playerId);
    addHistoryEntry(roomId, {
      player: drawerName,
      action: 'robó',
      target: ' una carta'
    });

    // mano privada al jugador
    const hand = getPlayerHand(roomId, playerId) || [];
    const payload: PlayerHandPayload = { roomId, playerId, hand };
    socket.emit(GAME_CONSTANTS.GAME_HAND, payload);

    // estado público a toda la sala
    const publicState = getPublicState(roomId);
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, publicState);
  });

  socket.on(GAME_CONSTANTS.GAME_GET_STATE, ({ roomId }) => {
    const publicState = getPublicState(roomId);
    socket.emit(GAME_CONSTANTS.GAME_STATE, publicState);
  });

  // Finalizar turno (solo jugador activo)
  socket.on(GAME_CONSTANTS.GAME_END_TURN, ({ roomId }) => {
    const pid = socket.data?.playerId;
    if (!pid) return;

    if (!isPlayersTurn(roomId, pid)) {
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_YOUR_TURN);
      return;
    }

    endTurn(roomId);
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, getPublicState(roomId));
  });

  socket.on(
    GAME_CONSTANTS.GAME_PLAY_CARD,
    (data: { roomId: string; cardId: string; target?: AnyPlayTarget }) => {
      const { roomId, cardId, target } = data || {};
      const playerId = socket.data?.playerId;

      logger.info(
        `[${
          GAME_CONSTANTS.GAME_PLAY_CARD
        }] room=${roomId} player=${playerId} card=${cardId} target=${
          target ? JSON.stringify(target) : '—'
        }`
      );

      if (!playerId) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_PLAYER);
        return;
      }

      const room = getRooms().find(r => r.id === roomId);
      if (!room) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_ROOM);
        return;
      }

      const playerInRoom = room.players.some(p => p.id === playerId);
      if (!playerInRoom) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_IN_ROOM);
        return;
      }

      if (!isPlayersTurn(roomId, playerId)) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_YOUR_TURN);
        return;
      }

      const gameBeforePlay = getGame(roomId);
      const cardInfo = findCardInGame(gameBeforePlay, cardId);
      const historyEntry = gameBeforePlay
        ? buildPlayCardHistoryEntry(gameBeforePlay, playerId, cardInfo, target)
        : null;

      try {
        const result = playCard(roomId, playerId, cardId, target);
        if (!result.success) {
          socket.emit(GAME_CONSTANTS.GAME_ERROR, result.error);
          return;
        }

        addHistoryEntry(roomId, historyEntry);

        const g = getGame(roomId);

        if (g) {
          const playedCard = g.discard[g.discard.length - 1]; // última carta descartada
          if (
            playedCard?.kind === CardKind.Treatment &&
            playedCard.subtype === TreatmentSubtype.Gloves
          ) {
            // enviar manos actualizadas a TODOS
            for (const pl of g.players) {
              const hand = getPlayerHand(roomId, pl.player.id) || [];
              const payload: PlayerHandPayload = { roomId, playerId: pl.player.id, hand };
              const sock = io.sockets.sockets.get(pl.player.socketId!);
              if (sock) sock.emit(GAME_CONSTANTS.GAME_HAND, payload);
            }
          } else {
            // caso normal → solo al jugador actual
            const hand = getPlayerHand(roomId, playerId) || [];
            const payload: PlayerHandPayload = { roomId, playerId, hand };
            socket.emit(GAME_CONSTANTS.GAME_HAND, payload);
          }
        }

        // estado público a todos
        io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, getPublicState(roomId));

        // 🏆 detectar si hay ganador
        if (g?.winner) {
          setRoomInProgress(roomId, false);
          wsEmitter.emitRoomsList();
          clearGame(roomId);

          io.to(roomId).emit(GAME_CONSTANTS.GAME_END, {
            roomId,
            winner: g.winner,
          });
          return; // 👈 no seguimos, la partida terminó
        }
      } catch (err: any) {
        logger.error(`[${GAME_CONSTANTS.GAME_PLAY_CARD}] ${err?.message || err}`);
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.SERVER_ERROR);
      }
    }
  );

  // ⏸️ Inicio de selección de objetivo (Trasplante, Contagio, Intercambio de cuerpo, …):
  // se marca una TargetSelection pendiente para pausar el timer de turno mientras el
  // jugador elige. Al confirmar la jugada se limpia en card.service (endTurn) y al
  // cancelar, el cliente emite GAME_SELECTION_CANCEL.
  socket.on(
    GAME_CONSTANTS.GAME_SELECTION_START,
    ({ roomId, cardId }: { roomId: string; cardId: string }) => {
      const playerId = socket.data?.playerId;
      if (!playerId) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_PLAYER);
        return;
      }

      const room = getRooms().find(r => r.id === roomId);
      if (!room) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_ROOM);
        return;
      }

      if (!room.players.some(p => p.id === playerId)) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_IN_ROOM);
        return;
      }

      if (!isPlayersTurn(roomId, playerId)) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_YOUR_TURN);
        return;
      }

      const g = getGame(roomId);
      if (!g) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_GAME);
        return;
      }

      const inHand =
        g.players.find(p => p.player.id === playerId)?.hand.some(c => c.id === cardId) ??
        false;
      if (!inHand) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_CARD);
        return;
      }

      g.pendingAction = { type: 'TargetSelection', playerId, cardId };
      logger.info(
        `[${GAME_CONSTANTS.GAME_SELECTION_START}] room=${roomId} player=${playerId} card=${cardId}`
      );
      io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, getPublicState(roomId));
    }
  );

  // ▶️ Cancelación de selección de objetivo: se limpia la TargetSelection pendiente
  // (si la hay para este jugador) y el timer del turno reanuda su cuenta atrás.
  socket.on(GAME_CONSTANTS.GAME_SELECTION_CANCEL, ({ roomId }: { roomId: string }) => {
    const playerId = socket.data?.playerId;
    if (!playerId) return;

    const g = getGame(roomId);
    if (!g) return;

    if (g.pendingAction && g.pendingAction.playerId === playerId) {
      delete g.pendingAction;
      g.pauseStartedAt = undefined;
      logger.info(
        `[${GAME_CONSTANTS.GAME_SELECTION_CANCEL}] room=${roomId} player=${playerId}`
      );
      io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, getPublicState(roomId));
    }
  });

  socket.on(GAME_CONSTANTS.GAME_DISCARD, ({ roomId, cardIds }) => {
    const playerId = socket.data?.playerId;
    // const pid = socket.data?.playerId as string | undefined;;
    if (!playerId) return;

    if (!isPlayersTurn(roomId, playerId)) {
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_YOUR_TURN);
      return;
    }

    const res = discardCards(roomId, playerId, cardIds);
    if (!res.success) {
      socket.emit(GAME_CONSTANTS.GAME_ERROR, res.error);
      return;
    }

    const gameAfterDiscard = getGame(roomId);
    const quantity = cardIds?.length ?? 0;
    if (quantity > 0) {
      const playerName = getPlayerName(gameAfterDiscard, playerId);
      const suffix = quantity === 1 ? 'carta' : 'cartas';
      addHistoryEntry(roomId, {
        player: playerName,
        action: 'descartó',
        target: ` ${quantity} ${suffix}`
      });
    }

    // Estado público actualizado para todos
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, getPublicState(roomId));

    // Mano privada actualizada SOLO para el jugador
    const hand = getPlayerHand(roomId, playerId) || [];
    const payload: PlayerHandPayload = { roomId, playerId, hand };
    socket.emit(GAME_CONSTANTS.GAME_HAND, payload);
  });

  socket.on(GAME_CONSTANTS.ROOM_RESET, ({ roomId }) => {
    const room = getRooms().find(r => r.id === roomId);
    if (!room) return;

    // Reiniciar partida
    startGame(roomId, room.players, room.config);
    setRoomInProgress(roomId, true);
    wsEmitter.emitRoomsList();
    addHistoryEntry(roomId, 'La partida se reinició');

    // Emitir nuevo estado público
    const publicState = getPublicState(roomId);
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STARTED, publicState);

    // Emitir manos privadas
    for (const pl of room.players) {
      const hand = getPlayerHand(roomId, pl.id) || [];
      const payload: PlayerHandPayload = { roomId, playerId: pl.id, hand };
      io.to(roomId).emit(GAME_CONSTANTS.GAME_HAND, payload);
    }

    // 👈 importante: notificar que ya no hay ganador
    io.to(roomId).emit(GAME_CONSTANTS.GAME_END, { roomId, winner: null });
  });

  // 🎉 Reacción (emote): solo se enruta a toda la sala (incluido el remitente).
  // No requiere partida en curso: es social (valida, celebra, se despide).
  // Sin persistencia ni efectos sobre el estado de la partida.
  socket.on(GAME_CONSTANTS.EMOTE, ({ roomId, emote }: { roomId: string; emote: string }) => {
    const playerId = socket.data?.playerId;
    if (!playerId) {
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_PLAYER);
      return;
    }

    const room = getRooms().find(r => r.id === roomId);
    if (!room) {
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_ROOM);
      return;
    }

    if (!room.players.some(p => p.id === playerId)) {
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_IN_ROOM);
      return;
    }

    if (!EMOTES.includes(emote)) {
      logger.warn(`[${GAME_CONSTANTS.EMOTE}] room=${roomId} player=${playerId} emote inválido=${emote}`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.EMOTE_INVALID);
      return;
    }

    logger.info(`[${GAME_CONSTANTS.EMOTE}] room=${roomId} player=${playerId} emote=${emote}`);
    io.to(roomId).emit(GAME_CONSTANTS.EMOTE, { roomId, playerId, emote, at: Date.now() });
  });
};

export default registerGameEvents;
