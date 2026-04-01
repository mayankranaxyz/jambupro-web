import { Product } from "./models";

export async function ensureDemoProduct(): Promise<void> {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.create({
    name: "Demo Property Pack",
    price: 999,
    description: "Sample product for wishlist & checkout testing.",
    images: [{ url: "https://placehold.co/600x400/png?text=Jambu+Pro" }],
  });
}
