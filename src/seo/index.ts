export { buildMetadata, type BuildMetadataInput } from './metadata';
export { getHreflangMap } from './hreflang';
export { LOCALES, DEFAULT_LOCALE, SITE_ORIGIN, isLocale, type Locale } from './locales';

export { OrganizationSchema } from './schema/Organization';
export { WebSiteSchema } from './schema/WebSite';
export { WebApplicationSchema } from './schema/WebApplication';
export { ArticleSchema, type ArticleSchemaProps } from './schema/Article';
export { BreadcrumbSchema, type BreadcrumbItem } from './schema/Breadcrumb';
export { FAQSchema, type FAQItem } from './schema/FAQ';
export { HowToSchema, type HowToSchemaProps, type HowToStep } from './schema/HowTo';
export { ItemListSchema, type ItemListItem } from './schema/ItemList';
export { BookSchema, type BookSchemaProps } from './schema/Book';
export { ProfilePageSchema, type ProfilePageSchemaProps } from './schema/ProfilePage';
export {
  DiscussionForumPostingSchema,
  type DiscussionForumPostingSchemaProps,
} from './schema/DiscussionForumPosting';

export { AnswerBlock, type AnswerBlockProps } from './citability/AnswerBlock';
export { FAQBlock } from './citability/FAQBlock';
export { KeyFacts, type KeyFactItem } from './citability/KeyFacts';
