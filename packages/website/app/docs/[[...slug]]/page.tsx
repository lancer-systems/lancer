import defaultMdxComponents from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";

import { source } from "../../../lib/source";

interface PageData {
	title: string;
	description?: string;
	full?: boolean;
	body: ComponentType<{ components?: Record<string, unknown> }>;
	toc: { title: string; url: string; depth: number }[];
}

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
	const params = await props.params;
	const page = source.getPage(params.slug);

	if (!page) {
		notFound();
	}

	const data = page.data as unknown as PageData;
	const Mdx = data.body;

	return (
		<DocsPage toc={data.toc} full={data.full}>
			<DocsTitle>{data.title}</DocsTitle>
			<DocsDescription>{data.description}</DocsDescription>
			<DocsBody>
				<Mdx components={{ ...defaultMdxComponents }} />
			</DocsBody>
		</DocsPage>
	);
}

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
	const params = await props.params;
	const page = source.getPage(params.slug);

	if (!page) {
		notFound();
	}

	return {
		title: page.data.title,
		description: page.data.description,
	};
}
