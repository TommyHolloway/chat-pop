/**
 * Circuit Breaker Pattern Implementation
 * Provides graceful degradation when external services fail
 */

interface CircuitBreakerConfig {
  failureThreshold: number;  // Failures before opening circuit
  resetTimeoutMs: number;    // Time before attempting half-open
  name: string;
}

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

// In-memory circuit state (resets on cold start, which is acceptable for edge functions)
const circuits = new Map<string, CircuitState>();

/**
 * Execute an operation with circuit breaker protection
 * @param config Circuit breaker configuration
 * @param operation The async operation to execute
 * @param fallback Optional fallback function when circuit is open
 */
export async function withCircuitBreaker<T>(
  config: CircuitBreakerConfig,
  operation: () => Promise<T>,
  fallback?: () => T | Promise<T>
): Promise<T> {
  const circuit = circuits.get(config.name) || { 
    failures: 0, 
    lastFailure: 0, 
    state: 'closed' as const 
  };
  
  // Check if circuit is open
  if (circuit.state === 'open') {
    const timeSinceFailure = Date.now() - circuit.lastFailure;
    
    if (timeSinceFailure > config.resetTimeoutMs) {
      // Try to transition to half-open
      circuit.state = 'half-open';
      console.log(`Circuit ${config.name} transitioning to half-open`);
    } else if (fallback) {
      console.log(`Circuit ${config.name} is open, using fallback`);
      return await fallback();
    } else {
      throw new Error(`Service temporarily unavailable: ${config.name} (circuit open)`);
    }
  }
  
  try {
    const result = await operation();
    
    // Success - reset circuit
    if (circuit.state === 'half-open') {
      console.log(`Circuit ${config.name} recovered, closing circuit`);
    }
    circuit.failures = 0;
    circuit.state = 'closed';
    circuits.set(config.name, circuit);
    
    return result;
  } catch (error) {
    circuit.failures++;
    circuit.lastFailure = Date.now();
    
    if (circuit.failures >= config.failureThreshold) {
      circuit.state = 'open';
      console.error(`Circuit ${config.name} opened after ${circuit.failures} failures`);
    }
    
    circuits.set(config.name, circuit);
    
    // If circuit just opened and we have a fallback, use it
    if (circuit.state === 'open' && fallback) {
      console.log(`Circuit ${config.name} opened, using fallback`);
      return await fallback();
    }
    
    throw error;
  }
}

/**
 * Get current circuit state (for monitoring/debugging)
 */
export function getCircuitState(name: string): CircuitState | null {
  return circuits.get(name) || null;
}

/**
 * Manually reset a circuit (for admin operations)
 */
export function resetCircuit(name: string): void {
  circuits.delete(name);
  console.log(`Circuit ${name} manually reset`);
}
