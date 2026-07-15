import { permanentRedirect } from "next/navigation";
import ClientWrapper from "./ClientWrapper";
import { generateSlug } from "../../../src/lib/utils";
import { supabase } from "../../../src/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CategoryNewsPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const requestSlug = generateSlug(decodedName);

  if (name !== requestSlug) {
    permanentRedirect(`/category-news/${requestSlug}`);
  }

  let categoryName = decodedName;
  let canonicalSlug = requestSlug;

  const { data, error } = await supabase
    .from("settings")
    .select("data")
    .eq("id", "general")
    .maybeSingle();

  if (error) {
    console.error("Không thể tải danh mục tin tức:", error);
  } else {
    const categories = data?.data?.newsCategoriesExt || [];
    const category = categories.find((item: { name?: string }) => {
      return (
        item.name === decodedName ||
        generateSlug(item.name || "") === generateSlug(decodedName)
      );
    });

    if (category?.name) {
      categoryName = category.name;
      canonicalSlug = generateSlug(category.name);
    }
  }

  if (name !== canonicalSlug) {
    permanentRedirect(`/category-news/${canonicalSlug}`);
  }

  return <ClientWrapper categoryName={categoryName} />;
}
