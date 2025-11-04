import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Error boundary that catches navigation context errors
 * and shows a loading screen instead of crashing
 */
export class NavigationErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a navigation context error
    if (error.message?.includes('navigation context') || error.message?.includes('NavigationContainer')) {
      return {
        hasError: true,
        errorMessage: error.message,
      };
    }
    // Re-throw other errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('[NavigationErrorBoundary] Caught error:', error.message);
    // Navigation errors are recoverable - component will retry when context is ready
  }

  componentDidUpdate() {
    // Try to recover after a short delay
    if (this.state.hasError) {
      setTimeout(() => {
        this.setState({ hasError: false, errorMessage: null });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 14 }}>
            Loading navigation...
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
