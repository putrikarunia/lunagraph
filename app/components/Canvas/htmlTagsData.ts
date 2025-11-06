import { FEElement } from "./types"

export interface HTMLTagData {
  tag: string
  title: string
  description: string
  defaultStyles: React.CSSProperties
  previewColor: string
  category: 'layout' | 'text' | 'media' | 'form' | 'semantic'
}

export const htmlTags: HTMLTagData[] = [
  {
    tag: 'div',
    title: 'Div',
    description: 'Generic container for grouping elements',
    defaultStyles: {
      width: '200px',
      height: '100px',
      background: '#f3f4f6',
      display: 'flex',
      padding: '16px',
    },
    previewColor: '#9ca3af',
    category: 'layout'
  },
  {
    tag: 'section',
    title: 'Section',
    description: 'Thematic grouping of content',
    defaultStyles: {
      width: '300px',
      height: '150px',
      background: '#f3f4f6',
      display: 'flex',
      padding: '24px',
    },
    previewColor: '#8b5cf6',
    category: 'semantic'
  },
  {
    tag: 'header',
    title: 'Header',
    description: 'Introductory content or navigation',
    defaultStyles: {
      width: '100%',
      height: '80px',
      background: '#f3f4f6',
      display: 'flex',
      padding: '16px',
      alignItems: 'center',
    },
    previewColor: '#3b82f6',
    category: 'semantic'
  },
  {
    tag: 'footer',
    title: 'Footer',
    description: 'Footer content for section or page',
    defaultStyles: {
      width: '100%',
      height: '80px',
      background: '#f3f4f6',
      display: 'flex',
      padding: '16px',
      alignItems: 'center',
    },
    previewColor: '#6366f1',
    category: 'semantic'
  },
  {
    tag: 'nav',
    title: 'Nav',
    description: 'Navigation links section',
    defaultStyles: {
      width: '200px',
      height: '60px',
      background: '#f3f4f6',
      display: 'flex',
      padding: '12px',
      gap: '12px',
    },
    previewColor: '#10b981',
    category: 'semantic'
  },
  {
    tag: 'article',
    title: 'Article',
    description: 'Self-contained composition',
    defaultStyles: {
      width: '300px',
      height: '200px',
      background: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
    },
    previewColor: '#f59e0b',
    category: 'semantic'
  },
  {
    tag: 'aside',
    title: 'Aside',
    description: 'Sidebar or tangentially related content',
    defaultStyles: {
      width: '200px',
      height: '300px',
      background: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
    },
    previewColor: '#ec4899',
    category: 'semantic'
  },
  {
    tag: 'main',
    title: 'Main',
    description: 'Main content of the document',
    defaultStyles: {
      width: '100%',
      height: '400px',
      background: '#f3f4f6',
      display: 'flex',
      padding: '24px',
    },
    previewColor: '#14b8a6',
    category: 'semantic'
  },
  {
    tag: 'h1',
    title: 'Heading 1',
    description: 'Main page heading',
    defaultStyles: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0',
    },
    previewColor: '#1f2937',
    category: 'text'
  },
  {
    tag: 'h2',
    title: 'Heading 2',
    description: 'Section heading',
    defaultStyles: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0',
    },
    previewColor: '#374151',
    category: 'text'
  },
  {
    tag: 'h3',
    title: 'Heading 3',
    description: 'Subsection heading',
    defaultStyles: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0',
    },
    previewColor: '#4b5563',
    category: 'text'
  },
  {
    tag: 'p',
    title: 'Paragraph',
    description: 'Block of text content',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      margin: '0',
      lineHeight: '1.5',
    },
    previewColor: '#6b7280',
    category: 'text'
  },
  {
    tag: 'span',
    title: 'Span',
    description: 'Inline text container',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
    },
    previewColor: '#9ca3af',
    category: 'text'
  },
  {
    tag: 'a',
    title: 'Link',
    description: 'Hyperlink to other pages or resources',
    defaultStyles: {
      fontSize: '16px',
      color: '#3b82f6',
      textDecoration: 'underline',
      cursor: 'pointer',
    },
    previewColor: '#2563eb',
    category: 'text'
  },
  {
    tag: 'button',
    title: 'Button',
    description: 'Clickable button element',
    defaultStyles: {
      padding: '8px 16px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
    },
    previewColor: '#3b82f6',
    category: 'form'
  },
  {
    tag: 'input',
    title: 'Input',
    description: 'Text input field',
    defaultStyles: {
      width: '200px',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
    },
    previewColor: '#d1d5db',
    category: 'form'
  },
  {
    tag: 'textarea',
    title: 'Textarea',
    description: 'Multi-line text input',
    defaultStyles: {
      width: '250px',
      height: '100px',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
      resize: 'vertical',
    },
    previewColor: '#d1d5db',
    category: 'form'
  },
  {
    tag: 'select',
    title: 'Select',
    description: 'Dropdown selection menu',
    defaultStyles: {
      width: '200px',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
    },
    previewColor: '#d1d5db',
    category: 'form'
  },
  {
    tag: 'label',
    title: 'Label',
    description: 'Label for form inputs',
    defaultStyles: {
      fontSize: '14px',
      color: '#374151',
      fontWeight: '500',
    },
    previewColor: '#6b7280',
    category: 'form'
  },
  {
    tag: 'form',
    title: 'Form',
    description: 'Container for form inputs',
    defaultStyles: {
      width: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      background: '#f9fafb',
    },
    previewColor: '#e5e7eb',
    category: 'form'
  },
  {
    tag: 'img',
    title: 'Image',
    description: 'Embedded image',
    defaultStyles: {
      width: '200px',
      height: '150px',
      objectFit: 'cover',
      background: '#e5e7eb',
    },
    previewColor: '#9ca3af',
    category: 'media'
  },
  {
    tag: 'video',
    title: 'Video',
    description: 'Video player',
    defaultStyles: {
      width: '400px',
      height: '225px',
      background: '#1f2937',
    },
    previewColor: '#374151',
    category: 'media'
  },
  {
    tag: 'audio',
    title: 'Audio',
    description: 'Audio player',
    defaultStyles: {
      width: '300px',
    },
    previewColor: '#6b7280',
    category: 'media'
  },
  {
    tag: 'ul',
    title: 'Unordered List',
    description: 'Bulleted list container',
    defaultStyles: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '0 0 0 24px',
      margin: '0',
    },
    previewColor: '#6b7280',
    category: 'text'
  },
  {
    tag: 'ol',
    title: 'Ordered List',
    description: 'Numbered list container',
    defaultStyles: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '0 0 0 24px',
      margin: '0',
    },
    previewColor: '#6b7280',
    category: 'text'
  },
  {
    tag: 'li',
    title: 'List Item',
    description: 'Individual list item',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      lineHeight: '1.5',
    },
    previewColor: '#9ca3af',
    category: 'text'
  },
]

export const createElementFromTag = (tagData: HTMLTagData): FEElement => {
  const getTextContent = (): string | undefined => {
    // Only text-level elements should have text content
    switch (tagData.tag) {
      case 'p': return 'Paragraph text'
      case 'span': return 'Text'
      case 'a': return 'Link text'
      case 'h1': return 'Heading 1'
      case 'h2': return 'Heading 2'
      case 'h3': return 'Heading 3'
      case 'button': return 'Button'
      case 'label': return 'Label'
      case 'li': return 'List item'
      default: return undefined
    }
  }

  const textContent = getTextContent()

  return {
    id: `element-${Date.now()}`,
    type: "html",
    tag: tagData.tag,
    styles: tagData.defaultStyles,
    canvasPosition: {
      x: 100,
      y: 100
    },
    children: textContent ? [{
      id: `text-${Date.now()}`,
      type: "text",
      tag: "span",
      text: textContent
    }] : []
  }
}
