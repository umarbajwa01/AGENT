export function Pager({ data, page, setPage }) {
  return (
    <div className="pager">
      <span>
        {data.total} records · Page {page}
      </span>
      <div>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <button
          disabled={page * data.limit >= data.total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
