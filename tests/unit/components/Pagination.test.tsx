// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@components/ui/pagination';

describe('Pagination Primitives', () => {
  afterEach(cleanup);

  it('renders complete accessible pagination tree', () => {
    const handlePageClick = vi.fn();

    render(
      <Pagination aria-label="Test pagination">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => handlePageClick('prev')} />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive onClick={() => handlePageClick(1)}>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink onClick={() => handlePageClick(2)}>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext onClick={() => handlePageClick('next')} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );

    const nav = screen.getByRole('navigation', { name: 'Test pagination' });
    expect(nav).toBeTruthy();

    const activeLink = screen.getByRole('button', { name: '1' });
    expect(activeLink.getAttribute('aria-current')).toBe('page');

    const page2 = screen.getByRole('button', { name: '2' });
    expect(page2.getAttribute('aria-current')).toBeNull();
    fireEvent.click(page2);
    expect(handlePageClick).toHaveBeenCalledWith(2);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton.getAttribute('aria-label')).toBe('Go to previous page');
    fireEvent.click(prevButton);
    expect(handlePageClick).toHaveBeenCalledWith('prev');

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton.getAttribute('aria-label')).toBe('Go to next page');
    fireEvent.click(nextButton);
    expect(handlePageClick).toHaveBeenCalledWith('next');

    expect(screen.getByText('More pages')).toBeTruthy();
  });

  it('supports custom labels and localized aria-label for Previous and Next', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious label="Poprzednia" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext label="Następna" aria-label="Przejdź do następnej strony" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );

    const prevBtn = screen.getByRole('button', { name: 'Poprzednia' });
    expect(prevBtn).toBeTruthy();
    expect(prevBtn.getAttribute('aria-label')).toBe('Poprzednia');

    const nextBtn = screen.getByRole('button', { name: 'Przejdź do następnej strony' });
    expect(nextBtn).toBeTruthy();
    expect(nextBtn.getAttribute('aria-label')).toBe('Przejdź do następnej strony');
  });
});
