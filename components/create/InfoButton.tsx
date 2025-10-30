import { TouchableOpacity } from 'react-native';
import { Info } from 'lucide-react-native';

interface InfoButtonProps {
  onPress: () => void;
  size?: number;
  color?: string;
}

export function InfoButton({ onPress, size = 18, color = '#6B7280' }: InfoButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
      }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Info color={color} size={size} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}
