export const pageQuery = (q) => ({
  page: Math.max(1, Math.min(10000, Number(q.page) || 1)),
  limit: Math.max(1, Math.min(100, Number(q.limit) || 20)),
});
export async function paginated(Model, filter, q, projection) {
  const { page, limit } = pageQuery(q);
  const [items, total] = await Promise.all([
    Model.find(filter, projection)
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Model.countDocuments(filter),
  ]);
  return {
    items,
    total,
    page,
    limit,
  };
}
