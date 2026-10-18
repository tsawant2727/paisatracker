export const DEFAULT_USER_ID = "user-local-1";

export const EXPENSE_CATEGORIES = [
  { name: "Rent/Home", icon: "🏠" },
  { name: "Groceries & Food", icon: "🛒" },
  { name: "Transport/Fuel", icon: "🛵" },
  { name: "Bills/Phone/Internet", icon: "📱" },
  { name: "Family Support", icon: "👨‍👩‍👧" },
  { name: "EMI/Debt", icon: "🏦" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Entertainment/Eating Out", icon: "🍽️" },
  { name: "Health/Personal Care", icon: "💊" },
  { name: "Subscriptions", icon: "📺" },
  { name: "Misc/Buffer", icon: "📦" },
] as const;

export const INCOME_CATEGORIES = [
  { name: "Salary", icon: "💼" },
  { name: "Freelance", icon: "💻" },
  { name: "Side projects", icon: "🚀" },
  { name: "Refund/Cashback", icon: "↩️" },
  { name: "Other", icon: "✨" },
] as const;
