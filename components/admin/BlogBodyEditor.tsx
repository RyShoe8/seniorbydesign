'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useMemo, useRef, useState } from 'react';
import styles from './blog-body-editor.module.css';

type Props = {
  documentKey: string;
  initialHtml: string;
  onChange: (html: string) => void;
  minHeight?: number;
  onUploadingChange?: (uploading: boolean) => void;
};

function Toolbar({
  editor,
  onPickImage,
  uploadingImage,
}: {
  editor: Editor | null;
  onPickImage: () => void;
  uploadingImage: boolean;
}) {
  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = typeof window !== 'undefined' ? window.prompt('Link URL', prev || 'https://') : null;
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        data-active={editor.isActive('bold')}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        data-active={editor.isActive('italic')}
      >
        Italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        data-active={editor.isActive('heading', { level: 2 })}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        data-active={editor.isActive('heading', { level: 3 })}
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        data-active={editor.isActive('heading', { level: 4 })}
      >
        H4
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        data-active={editor.isActive('bulletList')}
      >
        List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        data-active={editor.isActive('orderedList')}
      >
        1. List
      </button>
      <button type="button" onClick={setLink} data-active={editor.isActive('link')}>
        Link
      </button>
      <button type="button" onClick={onPickImage} disabled={uploadingImage}>
        {uploadingImage ? 'Uploading…' : 'Image'}
      </button>
    </div>
  );
}

export function BlogBodyEditor({
  documentKey,
  initialHtml,
  onChange,
  minHeight = 280,
  onUploadingChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        strike: false,
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'blog-inline-image',
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your post… Use the toolbar for bold, headings, lists, links, and images.',
      }),
    ],
    []
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: initialHtml?.trim() ? initialHtml : '<p></p>',
      editorProps: {
        attributes: {
          class: styles.editor,
          style: `min-height:${minHeight}px`,
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML());
      },
      onCreate: ({ editor: ed }) => {
        onChange(ed.getHTML());
      },
    },
    [documentKey]
  );

  const handlePickImage = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setUploadingImage(true);
    onUploadingChange?.(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'blog');
    formData.append('spaceType', 'blog-inline');

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const url = data.url as string;
        const alt = (data.altText as string) || '';
        editor.chain().focus().setImage({ src: url, alt }).run();
        onChange(editor.getHTML());
      } else {
        alert('Failed to upload image');
      }
    } catch {
      alert('Error uploading image');
    } finally {
      setUploadingImage(false);
      onUploadingChange?.(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        id={`blog-body-file-${documentKey}`}
        ref={fileRef}
        type="file"
        accept="image/*"
        className={styles.hiddenFile}
        aria-label="Upload image into post body"
        onChange={handleFileChange}
      />
      <Toolbar editor={editor} onPickImage={handlePickImage} uploadingImage={uploadingImage} />
      <div className={styles.editorWrap}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
