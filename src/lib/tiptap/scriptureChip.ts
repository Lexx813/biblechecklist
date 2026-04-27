import { Node, mergeAttributes, nodeInputRule } from "@tiptap/core";
import { wolUrlFor } from "../songs/wolUrl";

/**
 * Inline scripture chip. Renders as an anchor element styled as a pill that
 * deep-links to wol.jw.org for the verse. Authors can insert one via:
 *
 *   - The slash menu ("/scripture" → prompt for the reference)
 *   - The shorthand input rule: typing `[[John 14:16]] ` (closing brackets
 *     followed by space) consumes the literal text and inserts the chip.
 *
 * Stored shape: an inline atom node with attrs { reference, lang }. Renders
 * as <a class="scripture-chip" data-ref="..." href="..."> so DOMPurify
 * passes it through unchanged on published pages.
 */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    scriptureChip: {
      insertScriptureChip: (reference: string, lang?: "en" | "es") => ReturnType;
    };
  }
}

export const ScriptureChip = Node.create({
  name: "scriptureChip",
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      reference: { default: "" },
      lang: { default: "en" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a.scripture-chip[data-ref]",
        getAttrs(node) {
          const el = node as HTMLElement;
          return {
            reference: el.getAttribute("data-ref") ?? "",
            lang: el.getAttribute("data-lang") === "es" ? "es" : "en",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const reference: string = node.attrs.reference || "";
    const lang: "en" | "es" = node.attrs.lang === "es" ? "es" : "en";
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        href: wolUrlFor(reference, lang),
        class: "scripture-chip",
        "data-ref": reference,
        "data-lang": lang,
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      `\u{1F4D6} ${reference}`,
    ];
  },

  addCommands() {
    return {
      insertScriptureChip:
        (reference: string, lang: "en" | "es" = "en") =>
        ({ chain }) => {
          const trimmed = reference.trim();
          if (!trimmed) return false;
          return chain()
            .insertContent({
              type: this.name,
              attrs: { reference: trimmed, lang },
            })
            .insertContent(" ")
            .run();
        },
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\[\[([^\]]+?)\]\]\s$/,
        type: this.type,
        getAttributes: (match) => ({
          reference: (match[1] || "").trim(),
          lang: "en",
        }),
      }),
    ];
  },
});

export default ScriptureChip;
