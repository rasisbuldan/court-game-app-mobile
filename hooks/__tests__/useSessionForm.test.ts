import { renderHook, act } from '@testing-library/react-native';
import { useSessionForm } from '../useSessionForm';

describe('useSessionForm', () => {
  describe('Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useSessionForm());

      expect(result.current.formData).toMatchObject({
        name: '',
        club_name: '',
        club_id: null,
        sport: 'padel',
        type: 'mexicano',
        mode: 'sequential',
        scoring_mode: 'points',
        courts: 1,
        points_per_match: 21,
        duration_hours: 2,
        matchup_preference: 'any',
      });
    });

    it('sets default game_date to today', () => {
      const { result } = renderHook(() => useSessionForm());
      const today = new Date().toISOString().split('T')[0];

      expect(result.current.formData.game_date).toBe(today);
    });

    it('sets default game_time to 19:00', () => {
      const { result } = renderHook(() => useSessionForm());

      expect(result.current.formData.game_time).toBe('19:00');
    });
  });

  describe('Field Updates', () => {
    it('updates single field correctly', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('name', 'Test Session');
      });

      expect(result.current.formData.name).toBe('Test Session');
    });

    it('updates club_id and club_name', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('club_id', 'club-123');
        result.current.updateField('club_name', 'Test Club');
      });

      expect(result.current.formData.club_id).toBe('club-123');
      expect(result.current.formData.club_name).toBe('Test Club');
    });

    it('updates date and time separately', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('game_date', '2025-12-25');
        result.current.updateField('game_time', '14:30');
      });

      expect(result.current.formData.game_date).toBe('2025-12-25');
      expect(result.current.formData.game_time).toBe('14:30');
    });
  });

  describe('Sport Change Auto-Adjustments', () => {
    it('resets scoring mode to first_to when switching to tennis from points mode', () => {
      const { result } = renderHook(() => useSessionForm());

      // Start with padel + points
      expect(result.current.formData.sport).toBe('padel');
      expect(result.current.formData.scoring_mode).toBe('points');

      act(() => {
        result.current.updateField('sport', 'tennis');
      });

      expect(result.current.formData.scoring_mode).toBe('first_to');
      expect(result.current.formData.points_per_match).toBe(6);
    });

    it('keeps scoring mode as first_to when switching to tennis from first_to mode', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('scoring_mode', 'first_to');
      });

      expect(result.current.formData.scoring_mode).toBe('first_to');

      act(() => {
        result.current.updateField('sport', 'tennis');
      });

      // Switching to tennis from first_to keeps first_to mode
      expect(result.current.formData.scoring_mode).toBe('first_to');
      expect(result.current.formData.points_per_match).toBe(6);
    });

    it('resets scoring mode to points when switching to padel from first_to mode', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('sport', 'tennis');
        result.current.updateField('scoring_mode', 'first_to');
      });

      act(() => {
        result.current.updateField('sport', 'padel');
      });

      expect(result.current.formData.scoring_mode).toBe('points');
      expect(result.current.formData.points_per_match).toBe(21);
    });
  });

  describe('Mode Change Auto-Adjustments', () => {
    it('increases courts to 2 when switching to parallel with 1 court', () => {
      const { result } = renderHook(() => useSessionForm());

      // Start with 1 court
      expect(result.current.formData.courts).toBe(1);

      act(() => {
        result.current.updateField('mode', 'parallel');
      });

      expect(result.current.formData.courts).toBe(2);
      expect(result.current.formData.mode).toBe('parallel');
    });

    it('does not change courts when switching to parallel with 2+ courts', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('courts', 3);
      });

      act(() => {
        result.current.updateField('mode', 'parallel');
      });

      expect(result.current.formData.courts).toBe(3);
      expect(result.current.formData.mode).toBe('parallel');
    });
  });

  describe('Courts Change Auto-Adjustments', () => {
    it('switches to sequential when courts drops below 2 in parallel mode', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('mode', 'parallel');
        result.current.updateField('courts', 2);
      });

      expect(result.current.formData.mode).toBe('parallel');

      act(() => {
        result.current.updateField('courts', 1);
      });

      expect(result.current.formData.mode).toBe('sequential');
    });

    it('switches to sequential when courts exceeds 4 in parallel mode', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('mode', 'parallel');
        result.current.updateField('courts', 3);
      });

      expect(result.current.formData.mode).toBe('parallel');

      act(() => {
        result.current.updateField('courts', 5);
      });

      expect(result.current.formData.mode).toBe('sequential');
    });

    it('maintains parallel mode when courts is 2-4', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('mode', 'parallel');
      });

      [2, 3, 4].forEach((courtCount) => {
        act(() => {
          result.current.updateField('courts', courtCount);
        });

        expect(result.current.formData.mode).toBe('parallel');
        expect(result.current.formData.courts).toBe(courtCount);
      });
    });
  });

  describe('Game Type Auto-Adjustments', () => {
    it('locks matchup_preference to mixed_only for mixed_mexicano', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('type', 'mixed_mexicano');
      });

      expect(result.current.formData.matchup_preference).toBe('mixed_only');
    });

    it('does not override matchup_preference for other game types', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('matchup_preference', 'randomized_modes');
        result.current.updateField('type', 'mexicano');
      });

      expect(result.current.formData.matchup_preference).toBe('randomized_modes');
    });
  });

  describe('Scoring Mode Updates', () => {
    it('updates points_per_match when scoring_mode changes', () => {
      const { result } = renderHook(() => useSessionForm());

      const scoringModes: Array<{ mode: any; expectedPoints: number }> = [
        { mode: 'points', expectedPoints: 21 },
        { mode: 'first_to', expectedPoints: 6 },
        { mode: 'total_games', expectedPoints: 6 },
      ];

      scoringModes.forEach(({ mode, expectedPoints }) => {
        act(() => {
          result.current.updateField('scoring_mode', mode);
        });

        expect(result.current.formData.points_per_match).toBe(expectedPoints);
      });
    });
  });

  describe('Field Persistence', () => {
    it('maintains updated values after multiple changes', () => {
      const { result } = renderHook(() => useSessionForm());

      // Make multiple changes
      act(() => {
        result.current.updateField('name', 'Test Session');
        result.current.updateField('type', 'americano');
        result.current.updateField('courts', 3);
      });

      expect(result.current.formData.name).toBe('Test Session');
      expect(result.current.formData.type).toBe('americano');
      expect(result.current.formData.courts).toBe(3);
    });
  });

  describe('Complex Scenarios', () => {
    it('handles multiple rapid field changes correctly', () => {
      const { result } = renderHook(() => useSessionForm());

      act(() => {
        result.current.updateField('sport', 'tennis');
        result.current.updateField('mode', 'parallel');
        result.current.updateField('courts', 3);
        result.current.updateField('type', 'mixed_mexicano');
      });

      expect(result.current.formData.sport).toBe('tennis');
      expect(result.current.formData.mode).toBe('parallel');
      expect(result.current.formData.courts).toBe(3);
      expect(result.current.formData.type).toBe('mixed_mexicano');
      expect(result.current.formData.matchup_preference).toBe('mixed_only');
      expect(result.current.formData.scoring_mode).toBe('first_to');
    });

    it('maintains data integrity through sport + mode + courts changes', () => {
      const { result } = renderHook(() => useSessionForm());

      // Set to tennis with parallel mode
      act(() => {
        result.current.updateField('sport', 'tennis');
        result.current.updateField('mode', 'parallel');
      });

      expect(result.current.formData.courts).toBe(2); // Auto-adjusted for parallel
      expect(result.current.formData.scoring_mode).toBe('first_to'); // Tennis default

      // Try to set to 1 court
      act(() => {
        result.current.updateField('courts', 1);
      });

      expect(result.current.formData.mode).toBe('sequential'); // Auto-switched
    });
  });
});
