import * as M from "../models/index.js";
import { admin } from "../middleware/roles.js";
export function registerAnalyticsRoutes(api) {
  api.get("/admin/analytics", admin, async (req, res) => {
    const [orders, products, conversations, pending, totals, daily, lowStock] =
      await Promise.all([
        M.Order.countDocuments(),
        M.Product.countDocuments({
          active: true,
        }),
        M.Conversation.countDocuments({
          mode: "human",
        }),
        M.Order.countDocuments({
          status: "Pending Confirmation",
        }),
        M.Order.aggregate([
          {
            $group: {
              _id: null,
              booked: {
                $sum: "$total",
              },
              collected: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$paymentStatus", "Collected"],
                    },
                    "$total",
                    0,
                  ],
                },
              },
            },
          },
        ]),
        M.Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(Date.now() - 30 * 86400000),
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "Asia/Karachi",
                },
              },
              orders: {
                $sum: 1,
              },
              total: {
                $sum: "$total",
              },
            },
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ]),
        M.Product.find({
          active: true,
          "variants.stock": {
            $lt: 5,
          },
        }).limit(5),
      ]);
    res.json({
      orders,
      products,
      conversations,
      pending,
      booked: totals[0]?.booked || 0,
      collected: totals[0]?.collected || 0,
      daily,
      lowStock,
    });
  });
}
