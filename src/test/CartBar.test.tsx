import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CartBar from '../components/CartBar';
import * as CartContextModule from '@/contexts/CartContext';

// Mock framer-motion to avoid animation delay complexities in tests
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('CartBar Component', () => {
  it('does not render when the cart is empty', () => {
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      totalItems: 0,
      totalPrice: 0,
      items: [],
      addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn()
    });

    render(<CartBar onOpen={vi.fn()} />);
    expect(screen.queryByText('View Cart')).not.toBeInTheDocument();
  });

  it('renders and displays correct totals when cart has items', () => {
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      totalItems: 3,
      totalPrice: 450.50,
      items: [],
      addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn()
    });

    render(<CartBar onOpen={vi.fn()} />);
    
    expect(screen.getByText('View Cart')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Badge count
    expect(screen.getByText('₱450.50')).toBeInTheDocument(); // Formatted price
  });

  it('triggers onOpen callback when clicked', () => {
    const mockOnOpen = vi.fn();
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      totalItems: 1, totalPrice: 100, items: [],
      addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn()
    });

    render(<CartBar onOpen={mockOnOpen} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnOpen).toHaveBeenCalledTimes(1);
  });
});