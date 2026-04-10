import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast: "!bg-[#1a1a1a] !border !border-[#353535] !text-[#f5f5f5]",
        },
      }}
      {...props}
    />
  );
}
