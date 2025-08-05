// src/components/ErrorBoundary.jsx
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorDetails: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Analyze the error for object rendering issues
    let errorDetails = null;
    if (error.message && error.message.includes('Objects are not valid as a React child')) {
      errorDetails = this.analyzeObjectRenderingError(error, errorInfo);
    }
    
    this.setState({
      error,
      errorInfo,
      errorDetails
    });
    
    // Log to error reporting service
    if (window.errorReportingService) {
      window.errorReportingService.logError(error, errorInfo);
    }
  }

  analyzeObjectRenderingError(error, errorInfo) {
    const details = {
      type: 'object-rendering',
      message: 'Attempted to render an object as a React child',
      possibleCauses: []
    };

    // Extract object properties from error message
    const match = error.message.match(/object with keys \{([^}]+)\}/);
    if (match) {
      const keys = match[1].split(',').map(k => k.trim());
      details.objectKeys = keys;
      
      // Check for specific patterns
      if (keys.includes('performanceReport') || keys.includes('summary')) {
        details.possibleCauses.push('Report data object being rendered directly');
        details.suggestion = 'Check report components for direct object rendering';
      }
      
      if (keys.includes('officers') || keys.includes('cases')) {
        details.possibleCauses.push('Collection data being rendered without mapping');
        details.suggestion = 'Use .map() to render arrays of data';
      }
    }

    // Try to identify the component from the stack
    if (errorInfo && errorInfo.componentStack) {
      const stackLines = errorInfo.componentStack.split('\n');
      const relevantComponents = stackLines
        .filter(line => line.includes('at ') && !line.includes('node_modules'))
        .slice(0, 5);
      details.componentStack = relevantComponents;
    }

    return details;
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorDetails: null
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorDetails } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error details</AlertTitle>
                <AlertDescription>
                  {error && error.toString()}
                </AlertDescription>
              </Alert>

              {errorDetails && (
                <Alert>
                  <AlertTitle>Analysis</AlertTitle>
                  <AlertDescription className="space-y-2">
                    {errorDetails.objectKeys && (
                      <div>
                        <strong>Object properties detected:</strong>
                        <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                          {errorDetails.objectKeys.join(', ')}
                        </code>
                      </div>
                    )}
                    {errorDetails.suggestion && (
                      <div>
                        <strong>Suggestion:</strong> {errorDetails.suggestion}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {isDevelopment && errorInfo && (
                <details className="space-y-2">
                  <summary className="cursor-pointer font-medium">
                    Technical details (Development only)
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <Button 
                onClick={this.handleReset}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

