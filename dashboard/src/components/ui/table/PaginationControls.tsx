"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  const delta = 2;

  if (totalPages <= 0) {
    return null;
  }

  const getPageNumbers = () => {
    const range: number[] = [];
    const start = Math.max(2, page - delta);
    const end = Math.min(totalPages - 1, page + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  const handlePageClick = (e: React.MouseEvent, targetPage: number) => {
    e.preventDefault();
    if (targetPage !== page && targetPage >= 1 && targetPage <= totalPages) {
      onPageChange(targetPage);
    }
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => handlePageClick(e, page - 1)}
            className={
              page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
            }
          />
        </PaginationItem>

        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={(e) => handlePageClick(e, 1)}
            isActive={page === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>

        {page - delta > 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {getPageNumbers().map((num) => (
          <PaginationItem key={num}>
            <PaginationLink
              href="#"
              onClick={(e) => handlePageClick(e, num)}
              isActive={page === num}
            >
              {num}
            </PaginationLink>
          </PaginationItem>
        ))}

        {page + delta < totalPages - 1 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {totalPages > 1 && (
          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e) => handlePageClick(e, totalPages)}
              isActive={page === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const nextPage = page + 1;
              if (page < totalPages) {
                console.log(`Petición de cambio: de ${page} a ${nextPage}`);
                onPageChange(nextPage);
              }
            }}
            className={
              page >= totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};