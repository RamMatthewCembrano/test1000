import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutDrawer from '../components/CheckoutDrawer';
import * as CartContextModule from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// --- Mocks ---
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: vi.fn().mockReturnThis(), upload: vi.fn(), getPublicUrl: vi.fn() },
    from: vi.fn().mockReturnThis(), insert: vi.fn()
  }
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// Mock Drawer primitives
vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ open, children }: any) => open ? <div>{children}</div> : null,
  DrawerContent: ({ children }: any) => <div>{children}</div>,
  DrawerHeader: ({ children }: any) => <header>{children}</header>,
  DrawerTitle: ({ children }: any) => <h2>{children}</h2>,
  DrawerFooter: ({ children }: any) => <footer>{children}</footer>,
}));

// Mock Select using native HTML <select> for easy testing
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled, required }: any) => (
    <select
      data-testid="select-table"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
      required={required}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>
}));

// Mock RadioGroup using native HTML <input type="radio">
vi.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, value, onValueChange }: any) => (
    <div data-testid="radio-group" onChange={(e: any) => onValueChange(e.target.value)}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, id }: any) => (
    <input type="radio" id={id} value={value} name="payment-method" />
  )
}));

// Keep a copy of the original location so we don't break other tests
const originalLocation = window.location;

describe('CheckoutDrawer Component', () => {
  const mockClearCart = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      totalPrice: 500, 
      items: [{ id: '1', name: 'Meal', price: 500, quantity: 1, description: '', image: '', category: '' }],
      clearCart: mockClearCart, totalItems: 1, addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn()
    });

    // Reset URL to empty before every test safely
    delete (window as any).location;
    window.location = { ...originalLocation, search: '' };
  });

  afterEach(() => {
    // Restore the window object after the test
    window.location = originalLocation;
  });

  it('reads table number from URL query parameter if present', () => {
    // Force the fake browser URL to have our table number
    window.location.search = '?table=7';
    render(<CheckoutDrawer open={true} onClose={vi.fn()} onConfirm={mockOnConfirm} />);
    
    expect(screen.getByText('Table 7')).toBeInTheDocument();
    expect(screen.getByText('via QR')).toBeInTheDocument();
  });

  it('shows file upload when GCash/Online is selected', () => {
    render(<CheckoutDrawer open={true} onClose={vi.fn()} onConfirm={mockOnConfirm} />);
    
    // Now that it's a native radio button, fireEvent works perfectly!
    const onlineRadio = screen.getByLabelText('GCash / Online');
    fireEvent.click(onlineRadio);

    expect(screen.getByText('Scan to Pay via GCash')).toBeInTheDocument();
    expect(screen.getByText('Attach Receipt')).toBeInTheDocument();
  });

  it('prevents submission if table number is missing', async () => {
    render(<CheckoutDrawer open={true} onClose={vi.fn()} onConfirm={mockOnConfirm} />);
    
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'John Doe' } });
    
    // Explicitly target the form wrapper to trigger the submit function
    fireEvent.submit(screen.getByText('Place Order').closest('form')!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please select a table number.');
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('submits counter payment order successfully', async () => {
    window.location.search = '?table=3';
    (supabase.from().insert as vi.Mock).mockResolvedValueOnce({ error: null });

    render(<CheckoutDrawer open={true} onClose={vi.fn()} onConfirm={mockOnConfirm} />);
    
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Jane Doe' } });
    
    fireEvent.submit(screen.getByText('Place Order').closest('form')!);

    await waitFor(() => {
      expect(supabase.from().insert).toHaveBeenCalledWith([
        expect.objectContaining({
          customer_name: 'Jane Doe',
          table_number: '3',
          payment_method: 'counter',
          total_price: 500
        })
      ]);
      expect(toast.success).toHaveBeenCalledWith('Order placed successfully!');
      expect(mockClearCart).toHaveBeenCalled();
      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });
});