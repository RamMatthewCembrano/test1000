import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CartDrawer from '../components/CartDrawer';
import * as CartContextModule from '@/contexts/CartContext';

// Mock Drawer primitives to test purely logic
vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ open, children }: any) => open ? <div data-testid="drawer">{children}</div> : null,
  DrawerContent: ({ children }: any) => <div>{children}</div>,
  DrawerHeader: ({ children }: any) => <div>{children}</div>,
  DrawerTitle: ({ children }: any) => <div>{children}</div>,
  DrawerFooter: ({ children }: any) => <div>{children}</div>,
}));

describe('CartDrawer Component', () => {
  const mockUpdateQuantity = vi.fn();
  const mockRemoveItem = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnCheckout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays empty state message when cart is empty', () => {
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      items: [], totalPrice: 0, totalItems: 0,
      updateQuantity: mockUpdateQuantity, removeItem: mockRemoveItem,
      addItem: vi.fn(), clearCart: vi.fn()
    });

    render(<CartDrawer open={true} onClose={mockOnClose} onCheckout={mockOnCheckout} />);
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.queryByText('Proceed to Checkout')).not.toBeInTheDocument();
  });

  it('renders cart items and triggers quantity updates', () => {
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      items: [{ id: '1', name: 'Burger', price: 200, quantity: 2, description: '', image: '', category: '' }],
      totalPrice: 400, totalItems: 2,
      updateQuantity: mockUpdateQuantity, removeItem: mockRemoveItem,
      addItem: vi.fn(), clearCart: vi.fn()
    });

    render(<CartDrawer open={true} onClose={mockOnClose} onCheckout={mockOnCheckout} />);
    
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('₱400.00')).toBeInTheDocument();
    
    // Find action buttons (Mocking SVG icons makes button finding tricky, so we use container indices)
    const buttons = screen.getAllByRole('button');
    const minusBtn = buttons[0];
    const plusBtn = buttons[1];
    const trashBtn = buttons[2];
    const checkoutBtn = buttons[3];

    // Test actions
    fireEvent.click(plusBtn);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 3);

    fireEvent.click(minusBtn);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 1);

    fireEvent.click(trashBtn);
    expect(mockRemoveItem).toHaveBeenCalledWith('1');

    fireEvent.click(checkoutBtn);
    expect(mockOnCheckout).toHaveBeenCalled();
  });
});