export default function WysiwygRender({ text }: { text: string }) {
  return (
    <p
      className="text-justify wysiwyg-render"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}
