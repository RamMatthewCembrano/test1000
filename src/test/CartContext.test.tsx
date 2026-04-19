import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart, MenuItem } from '../contexts/CartContext';

const mockItem: MenuItem = {
  id: 'm1',
  name: 'Pancakes',
  description: 'Fluffy stack',
  price: 150,
  image: 'pancake.jpg',
  category: 'Breakfast'
};

const mockItem2: MenuItem = {
  id: 'm2',
  name: 'Burger',
  description: 'Beef patty',
  price: 200,
  image: 'burger.jpg',
  category: 'Lunch'
};

describe('CartContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  it('initializes with an empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('adds a new item to the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => { result.current.addItem(mockItem); });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({ ...mockItem, quantity: 1 });
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalPrice).toBe(150);
  });

  it('increments quantity if the same item is added again', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => { 
      result.current.addItem(mockItem);
      result.current.addItem(mockItem);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPrice).toBe(300);
  });

  it('updates item quantity correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => { result.current.addItem(mockItem); });
    act(() => { result.current.updateQuantity('m1', 5); });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalPrice).toBe(750);
  });

  it('removes item completely if quantity is updated to 0 or less', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => { result.current.addItem(mockItem); });
    act(() => { result.current.updateQuantity('m1', 0); });

    expect(result.current.items).toHaveLength(0);
  });

  it('removes an item explicitly via removeItem', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => { 
      result.current.addItem(mockItem);
      result.current.addItem(mockItem2);
    });
    
    act(() => { result.current.removeItem('m1'); });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('m2');
  });

  it('clears the entire cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => { 
      result.current.addItem(mockItem);
      result.current.addItem(mockItem2);
    });
    act(() => { result.current.clearCart(); });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
  });
});