import { renderHook, act } from '@testing-library/react-native';
import { usePlayerForm, Gender } from '../usePlayerForm';

describe('usePlayerForm', () => {
  describe('Initialization', () => {
    it('initializes with empty players array', () => {
      const { result } = renderHook(() => usePlayerForm());

      expect(result.current.players).toEqual([]);
    });
  });

  describe('addPlayer', () => {
    it('adds a player with default gender', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('John Doe');
      });

      expect(result.current.players).toHaveLength(1);
      expect(result.current.players[0]).toMatchObject({
        name: 'John Doe',
        gender: 'unspecified',
      });
      expect(result.current.players[0].id).toBeTruthy();
    });

    it('adds a player with specified gender', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Jane Doe', 'female');
      });

      expect(result.current.players[0]).toMatchObject({
        name: 'Jane Doe',
        gender: 'female',
      });
    });

    it('trims whitespace from player name', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('  John Doe  ');
      });

      expect(result.current.players[0].name).toBe('John Doe');
    });

    it('does not add player with empty name', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('');
      });

      expect(result.current.players).toHaveLength(0);
    });

    it('does not add player with only whitespace', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('   ');
      });

      expect(result.current.players).toHaveLength(0);
    });

    it('throws error for duplicate player names (case-insensitive)', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('John Doe');
      });

      expect(() => {
        act(() => {
          result.current.addPlayer('john doe');
        });
      }).toThrow('Player "john doe" already exists');

      expect(result.current.players).toHaveLength(1);
    });

    it('generates unique IDs for each player', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Player 1');
        result.current.addPlayer('Player 2');
        result.current.addPlayer('Player 3');
      });

      const ids = result.current.players.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('addPair', () => {
    it('adds a pair of players with partnership', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPair('Player 1', 'Player 2');
      });

      expect(result.current.players).toHaveLength(2);

      const [player1, player2] = result.current.players;
      expect(player1.partnerId).toBe(player2.id);
      expect(player2.partnerId).toBe(player1.id);
    });

    it('adds pair with specified genders', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPair('Male Player', 'Female Player', 'male', 'female');
      });

      expect(result.current.players[0].gender).toBe('male');
      expect(result.current.players[1].gender).toBe('female');
    });

    it('throws error if first name is empty', () => {
      const { result } = renderHook(() => usePlayerForm());

      expect(() => {
        act(() => {
          result.current.addPair('', 'Player 2');
        });
      }).toThrow('Both player names are required');

      expect(result.current.players).toHaveLength(0);
    });

    it('throws error if second name is empty', () => {
      const { result } = renderHook(() => usePlayerForm());

      expect(() => {
        act(() => {
          result.current.addPair('Player 1', '');
        });
      }).toThrow('Both player names are required');

      expect(result.current.players).toHaveLength(0);
    });

    it('throws error for duplicate names within pair', () => {
      const { result } = renderHook(() => usePlayerForm());

      expect(() => {
        act(() => {
          result.current.addPair('John Doe', 'john doe');
        });
      }).toThrow('Duplicate player names');
    });

    it('throws error if name duplicates existing player', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Existing Player');
      });

      expect(() => {
        act(() => {
          result.current.addPair('New Player', 'existing player');
        });
      }).toThrow('Duplicate player names');
    });
  });

  describe('removePlayer', () => {
    it('removes a player by ID', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Player 1');
        result.current.addPlayer('Player 2');
      });

      const playerIdToRemove = result.current.players[0].id;

      act(() => {
        result.current.removePlayer(playerIdToRemove);
      });

      expect(result.current.players).toHaveLength(1);
      expect(result.current.players[0].name).toBe('Player 2');
    });

    it('clears partner reference when removing player with partner', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPair('Player 1', 'Player 2');
      });

      const [player1, player2] = result.current.players;
      expect(player1.partnerId).toBe(player2.id);
      expect(player2.partnerId).toBe(player1.id);

      act(() => {
        result.current.removePlayer(player1.id);
      });

      expect(result.current.players).toHaveLength(1);
      expect(result.current.players[0].partnerId).toBeUndefined();
    });

    it('does nothing when removing non-existent player', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Player 1');
      });

      act(() => {
        result.current.removePlayer('non-existent-id');
      });

      expect(result.current.players).toHaveLength(1);
    });
  });

  describe('updateGender', () => {
    it('updates player gender', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Player 1', 'unspecified');
      });

      const playerId = result.current.players[0].id;

      act(() => {
        result.current.updateGender(playerId, 'male');
      });

      expect(result.current.players[0].gender).toBe('male');
    });

    it('toggles gender through all states', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Player 1');
      });

      const playerId = result.current.players[0].id;
      const genders: Gender[] = ['male', 'female', 'unspecified'];

      genders.forEach((gender) => {
        act(() => {
          result.current.updateGender(playerId, gender);
        });
        expect(result.current.players[0].gender).toBe(gender);
      });
    });

    it('does not affect other players when updating gender', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Player 1', 'male');
        result.current.addPlayer('Player 2', 'female');
      });

      const playerId = result.current.players[0].id;

      act(() => {
        result.current.updateGender(playerId, 'unspecified');
      });

      expect(result.current.players[0].gender).toBe('unspecified');
      expect(result.current.players[1].gender).toBe('female');
    });
  });

  describe('setPartner', () => {
    it('creates mutual partnership between two players', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Player 1');
        result.current.addPlayer('Player 2');
      });

      const [player1, player2] = result.current.players;

      act(() => {
        result.current.setPartner(player1.id, player2.id);
      });

      const updatedPlayers = result.current.players;
      expect(updatedPlayers[0].partnerId).toBe(player2.id);
      expect(updatedPlayers[1].partnerId).toBe(player1.id);
    });

    it('removes old partnership when setting new partner', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Player 1');
        result.current.addPlayer('Player 2');
        result.current.addPlayer('Player 3');
      });

      const [player1, player2, player3] = result.current.players;

      // Set player1 + player2 as partners
      act(() => {
        result.current.setPartner(player1.id, player2.id);
      });

      // Change player1's partner to player3
      act(() => {
        result.current.setPartner(player1.id, player3.id);
      });

      const updatedPlayers = result.current.players;
      const updatedPlayer1 = updatedPlayers.find((p) => p.id === player1.id);
      const updatedPlayer2 = updatedPlayers.find((p) => p.id === player2.id);
      const updatedPlayer3 = updatedPlayers.find((p) => p.id === player3.id);

      expect(updatedPlayer1?.partnerId).toBe(player3.id);
      expect(updatedPlayer2?.partnerId).toBeUndefined();
      expect(updatedPlayer3?.partnerId).toBe(player1.id);
    });

    it('clears partnership when partnerId is undefined', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPair('Player 1', 'Player 2');
      });

      const [player1, player2] = result.current.players;

      act(() => {
        result.current.setPartner(player1.id, undefined);
      });

      const updatedPlayers = result.current.players;
      expect(updatedPlayers[0].partnerId).toBeUndefined();
      expect(updatedPlayers[1].partnerId).toBeUndefined();
    });
  });

  describe('clearPlayers', () => {
    it('removes all players', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Player 1');
        result.current.addPlayer('Player 2');
        result.current.addPlayer('Player 3');
      });

      expect(result.current.players).toHaveLength(3);

      act(() => {
        result.current.clearPlayers();
      });

      expect(result.current.players).toHaveLength(0);
    });
  });

  describe('setPlayersFromImport', () => {
    it('imports players from array', () => {
      const { result } = renderHook(() => usePlayerForm());

      const importedPlayers = [
        { name: 'Player 1', gender: 'male' as Gender },
        { name: 'Player 2', gender: 'female' as Gender },
        { name: 'Player 3' },
      ];

      act(() => {
        result.current.setPlayersFromImport(importedPlayers);
      });

      expect(result.current.players).toHaveLength(3);
      expect(result.current.players[0]).toMatchObject({
        name: 'Player 1',
        gender: 'male',
      });
      expect(result.current.players[1]).toMatchObject({
        name: 'Player 2',
        gender: 'female',
      });
      expect(result.current.players[2]).toMatchObject({
        name: 'Player 3',
        gender: 'unspecified',
      });
    });

    it('replaces existing players on import', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('Existing Player');
      });

      expect(result.current.players).toHaveLength(1);

      act(() => {
        result.current.setPlayersFromImport([
          { name: 'Imported 1' },
          { name: 'Imported 2' },
        ]);
      });

      expect(result.current.players).toHaveLength(2);
      expect(result.current.players[0].name).toBe('Imported 1');
      expect(result.current.players[1].name).toBe('Imported 2');
    });

    it('generates unique IDs for imported players', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.setPlayersFromImport([
          { name: 'Player 1' },
          { name: 'Player 2' },
          { name: 'Player 3' },
        ]);
      });

      const ids = result.current.players.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('Complex Scenarios', () => {
    it('handles multiple partner reassignments', () => {
      const { result } = renderHook(() => usePlayerForm());

      act(() => {
        result.current.addPlayer('A');
        result.current.addPlayer('B');
        result.current.addPlayer('C');
        result.current.addPlayer('D');
      });

      const [a, b, c, d] = result.current.players;

      // A+B, C+D pairs
      act(() => {
        result.current.setPartner(a.id, b.id);
        result.current.setPartner(c.id, d.id);
      });

      let players = result.current.players;
      expect(players.find((p) => p.id === a.id)?.partnerId).toBe(b.id);
      expect(players.find((p) => p.id === c.id)?.partnerId).toBe(d.id);

      // Swap to A+C, B+D
      act(() => {
        result.current.setPartner(a.id, c.id);
        result.current.setPartner(b.id, d.id);
      });

      players = result.current.players;
      expect(players.find((p) => p.id === a.id)?.partnerId).toBe(c.id);
      expect(players.find((p) => p.id === b.id)?.partnerId).toBe(d.id);
    });

    it('maintains data integrity through add/remove/update cycles', () => {
      const { result } = renderHook(() => usePlayerForm());

      // Add players
      act(() => {
        result.current.addPair('P1', 'P2', 'male', 'female');
        result.current.addPlayer('P3', 'male');
      });

      expect(result.current.players).toHaveLength(3);

      // Remove one
      const p3Id = result.current.players[2].id;
      act(() => {
        result.current.removePlayer(p3Id);
      });

      expect(result.current.players).toHaveLength(2);

      // Update genders
      const [p1, p2] = result.current.players;
      act(() => {
        result.current.updateGender(p1.id, 'unspecified');
        result.current.updateGender(p2.id, 'unspecified');
      });

      expect(result.current.players[0].gender).toBe('unspecified');
      expect(result.current.players[1].gender).toBe('unspecified');

      // Partners should still be linked
      expect(result.current.players[0].partnerId).toBe(p2.id);
      expect(result.current.players[1].partnerId).toBe(p1.id);
    });
  });
});
