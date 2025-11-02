# Create Component

Scaffold a new React Native component with tests.

## Usage
```
/create-component PlayerCard
/create-component session/MatchCard
```

## Instructions

Create a complete React Native component with proper structure, types, and tests.

### Process:

1. **Determine Location**
   - Simple components → `components/ui/`
   - Feature components → `components/[feature]/`
   - Screen components → `app/(tabs)/[screen]/`

2. **Create Component File**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ComponentNameProps {
  // Define props with TypeScript
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

export function ComponentName({
  title,
  onPress,
  disabled = false,
}: ComponentNameProps) {
  return (
    <View className="bg-white rounded-lg p-4 shadow-sm">
      <Text className="text-lg font-semibold text-gray-900">
        {title}
      </Text>

      {onPress && (
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          className="mt-4 bg-primary-500 rounded-lg px-6 py-3"
          activeOpacity={0.7}
        >
          <Text className="text-white font-semibold text-center">
            Press Me
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

3. **Create Test File**

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('should render with title', () => {
    const { getByText } = render(
      <ComponentName title="Test Title" />
    );

    expect(getByText('Test Title')).toBeTruthy();
  });

  it('should call onPress when button pressed', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <ComponentName title="Test" onPress={mockPress} />
    );

    fireEvent.press(getByText('Press Me'));

    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('should not show button when onPress not provided', () => {
    const { queryByText } = render(
      <ComponentName title="Test" />
    );

    expect(queryByText('Press Me')).toBeNull();
  });

  it('should disable button when disabled prop is true', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <ComponentName title="Test" onPress={mockPress} disabled />
    );

    const button = getByText('Press Me').parent;

    expect(button?.props.disabled).toBe(true);
  });
});
```

4. **Component Checklist**
   - ✅ TypeScript interface for props
   - ✅ Props destructured with defaults
   - ✅ NativeWind (Tailwind) classes for styling
   - ✅ Proper React Native components (View, Text, TouchableOpacity)
   - ✅ No HTML elements (div, span, button)
   - ✅ activeOpacity for touch feedback
   - ✅ Accessibility labels (optional but recommended)
   - ✅ Memoization if needed (React.memo)

5. **Test Checklist**
   - ✅ Renders without crashing
   - ✅ All props work correctly
   - ✅ User interactions trigger callbacks
   - ✅ Conditional rendering tested
   - ✅ Edge cases covered
   - ✅ 80%+ coverage

6. **Best Practices**
   - Use NativeWind classes, not StyleSheet
   - Follow React Native naming (View not div)
   - Add testID for complex components
   - Keep components small and focused
   - Extract complex logic to hooks
   - Use TypeScript strict mode

7. **File Structure**
   ```
   components/
   └── feature/
       ├── ComponentName.tsx
       └── __tests__/
           └── ComponentName.test.tsx
   ```

### Deliverable:
- Complete component file with proper types and styling
- Comprehensive test file with 80%+ coverage
- Both files pass linting and type checking
