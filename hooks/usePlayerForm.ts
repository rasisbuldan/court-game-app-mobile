import { useState, useCallback } from 'react';

export type Gender = 'male' | 'female' | 'unspecified';

export interface PlayerFormData {
  id: string;
  name: string;
  gender: Gender;
  partnerId?: string;
}

export function usePlayerForm() {
  const [players, setPlayers] = useState<PlayerFormData[]>([]);

  const addPlayer = useCallback((name: string, gender: Gender = 'unspecified') => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    // Check for duplicates (case-insensitive)
    const isDuplicate = players.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error(`Player "${trimmedName}" already exists`);
    }

    const newPlayer: PlayerFormData = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      gender,
    };

    setPlayers((prev) => [...prev, newPlayer]);
  }, [players]);

  const addPair = useCallback(
    (name1: string, name2: string, gender1: Gender = 'unspecified', gender2: Gender = 'unspecified') => {
      const trimmedName1 = name1.trim();
      const trimmedName2 = name2.trim();

      if (!trimmedName1 || !trimmedName2) {
        throw new Error('Both player names are required');
      }

      // Check for duplicates (case-insensitive)
      const allNames = [...players.map((p) => p.name.toLowerCase()), trimmedName1.toLowerCase()];
      if (allNames.includes(trimmedName2.toLowerCase())) {
        throw new Error('Duplicate player names');
      }

      const player1: PlayerFormData = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: trimmedName1,
        gender: gender1,
        partnerId: '', // Will be set after player2 is created
      };

      const player2: PlayerFormData = {
        id: `${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
        name: trimmedName2,
        gender: gender2,
        partnerId: player1.id,
      };

      player1.partnerId = player2.id;

      setPlayers((prev) => [...prev, player1, player2]);
    },
    [players]
  );

  const removePlayer = useCallback((playerId: string) => {
    setPlayers((prev) => {
      // Find the player to remove
      const playerToRemove = prev.find((p) => p.id === playerId);
      if (!playerToRemove) return prev;

      // If they have a partner, clear the partner's partnerId
      const updatedPlayers = prev
        .filter((p) => p.id !== playerId)
        .map((p) => {
          if (p.partnerId === playerId) {
            return { ...p, partnerId: undefined };
          }
          return p;
        });

      return updatedPlayers;
    });
  }, []);

  const updateGender = useCallback((playerId: string, gender: Gender) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, gender } : p))
    );
  }, []);

  const setPartner = useCallback((playerId: string, partnerId: string | undefined) => {
    setPlayers((prev) => {
      const player = prev.find((p) => p.id === playerId);
      if (!player) return prev;

      // Remove old partnerships
      const withoutOldPartnerships = prev.map((p) => {
        // If this player had a partner, clear that partner's partnerId
        if (p.id === player.partnerId) {
          return { ...p, partnerId: undefined };
        }
        // If another player had this player as partner, clear it
        if (p.partnerId === playerId && p.id !== partnerId) {
          return { ...p, partnerId: undefined };
        }
        return p;
      });

      // Set new partnerships (mutual)
      return withoutOldPartnerships.map((p) => {
        if (p.id === playerId) {
          return { ...p, partnerId };
        }
        if (p.id === partnerId) {
          return { ...p, partnerId: playerId };
        }
        return p;
      });
    });
  }, []);

  const clearPlayers = useCallback(() => {
    setPlayers([]);
  }, []);

  const setPlayersFromImport = useCallback((importedPlayers: Array<{ name: string; gender?: Gender }>) => {
    const newPlayers: PlayerFormData[] = importedPlayers.map((p, index) => ({
      id: `${Date.now() + index}_${Math.random().toString(36).substr(2, 9)}`,
      name: p.name,
      gender: p.gender || 'unspecified',
    }));
    setPlayers(newPlayers);
  }, []);

  return {
    players,
    addPlayer,
    addPair,
    removePlayer,
    updateGender,
    setPartner,
    clearPlayers,
    setPlayersFromImport,
  };
}
