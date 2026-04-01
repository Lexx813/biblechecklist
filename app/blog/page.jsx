import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { blogApi } from "../../src/api/blog";
import ClientShell from "../_components/ClientShell";

export const revalidate = 120;

export const metadata = {
  title: "Blog | NWT Progress",
  description:
    "Spiritual insights, Bible study articles, and community reflections from the NWT Progress community.",
  alternates: { canonical: "https://nwtprogress.com/blog" },
  openGraph: {
    title: "Blog | NWT Progress",
    description:
      "Spiritual insights, Bible study articles, and community reflections from the NWT Progress community.",
  },
  twitter: {
    card: "summary",
    title: "Blog | NWT Progress",
    description:
      "Spiritual insights, Bible study articles, and community reflections from the NWT Progress community.",
  },
};

export default async function BlogListPage() {
  const queryClient = new QueryClient();

  await queryClient
    .prefetchQuery({
      queryKey: ["blog", "published", null],
      queryFn: () => blogApi.listPublished(),
    })
    .catch(() => {});

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientShell />
    </HydrationBoundary>
  );
}
