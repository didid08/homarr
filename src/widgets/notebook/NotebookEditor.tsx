import { ActionIcon, ScrollArea } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { IconEdit, IconEditOff } from '@tabler/icons-react';
import { BubbleMenu, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';
import { useRequiredBoard } from '~/components/Board/context';
import { useEditModeStore } from '~/components/Dashboard/Views/useEditModeStore';
import { useColorTheme } from '~/tools/color';
import { api } from '~/utils/api';

import { WidgetLoading } from '../loading';
import { INotebookWidget } from './NotebookWidgetTile';

Link.configure({
  openOnClick: true,
});

export function Editor({ widget }: { widget: INotebookWidget }) {
  const [content, setContent] = useState(widget.options.content);

  const { enabled } = useEditModeStore();
  const [isEditing, setIsEditing] = useState(false);

  const board = useRequiredBoard();
  const utils = api.useContext();
  const { primaryColor } = useColorTheme();

  const { mutateAsync } = api.notebook.update.useMutation();

  const [debouncedContent] = useDebouncedValue(content, 500);

  const editor = useEditor({
    extensions: [StarterKit, Link],
    content,
    editable: false,
    onUpdate: (e) => {
      setContent(e.editor.getHTML());
    },
  });

  const handleEditToggle = (previous: boolean) => {
    const current = !previous;
    if (!editor) return current;
    editor.setEditable(current);
    if (current) return current;

    utils.boards.byName.setData({ boardName: board.name }, (previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        sections: previous.sections.map((section) => {
          if (!section.items.some((item) => item.id === widget.id)) return section;
          return {
            ...section,
            items: section.items.map((item) => {
              if (item.id !== widget.id) return item;
              const notebookEditor = item as INotebookWidget;
              return {
                ...notebookEditor,
                options: {
                  ...notebookEditor.options,
                  content: debouncedContent,
                },
              };
            }),
          };
        }),
      };
    });

    void mutateAsync({
      boardName: board.name!,
      content: debouncedContent,
      widgetId: widget.id,
    });

    return current;
  };

  if (!board) return <WidgetLoading />;

  return (
    <>
      <RichTextEditor
        p={0}
        mt={0}
        h="100%"
        editor={editor}
        styles={(theme) => ({
          root: {
            '& .ProseMirror': {
              padding: '0  !important',
            },
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : 'white',
            border: 'none',
            borderRadius: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
          },
          toolbar: {
            backgroundColor: 'transparent',
            padding: '0.5rem',
          },
          content: {
            backgroundColor: 'transparent',
            padding: '0.5rem',
          },
        })}
      >
        <RichTextEditor.Toolbar
          style={{
            display: isEditing && widget.options.showToolbar === true ? 'flex' : 'none',
          }}
        >
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Code />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Blockquote />
            <RichTextEditor.Hr />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>
        {editor && (
          <BubbleMenu editor={editor}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Link />
            </RichTextEditor.ControlsGroup>
          </BubbleMenu>
        )}

        <ScrollArea>
          <RichTextEditor.Content />
        </ScrollArea>
      </RichTextEditor>
      {!enabled && (
        <ActionIcon
          style={{
            zIndex: 1,
          }}
          top={7}
          right={7}
          pos="absolute"
          color={primaryColor}
          variant="light"
          size={30}
          radius={'md'}
          onClick={() => setIsEditing(handleEditToggle)}
        >
          {isEditing ? <IconEditOff size={20} /> : <IconEdit size={20} />}
        </ActionIcon>
      )}
    </>
  );
}
