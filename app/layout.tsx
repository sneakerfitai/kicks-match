export const metadata = {
  title: "Kicks Match",
  description: "Match clothes to your kicks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ 
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        background: '#0b0b0c', color: '#eaeaea', margin: 0 
      }}>
        {children}
      </body>
    </html>
  );
}
