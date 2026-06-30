import { Outlet } from "react-router-dom";
import Header, { type HeaderProps } from "./Header";
import Sidebar, { type SidebarProps } from "./Sidebar";
import Content from "./Content";
import Footer, { type FooterProps } from "./Footer";

export interface MainLayoutProps {
  /** Sidebar configuration */
  sidebar: SidebarProps;
  /** Header configuration */
  header?: HeaderProps;
  /** Footer configuration */
  footer?: FooterProps;
  /** Whether to show the footer */
  showFooter?: boolean;
}

export default function MainLayout({
  sidebar,
  header,
  footer,
  showFooter = true,
}: MainLayoutProps) {
  const hasHeader = !!header;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header — fixed at top */}
      {hasHeader && <Header {...header} />}

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          {...sidebar}
          className={`${hasHeader ? "pt-16" : ""} ${sidebar.className ?? ""}`}
        />

        {/* Content area — sidebar is fixed, offset content with matching margin */}
        <div
          className={`flex flex-1 flex-col overflow-hidden ${sidebar.width ? sidebar.width.replace("w-", "ml-") : "ml-60"}`}
        >
          <Content className={hasHeader ? "pt-16" : ""}>
            <Outlet />
          </Content>

          {/* Optional footer */}
          {showFooter && footer && <Footer {...footer} />}
        </div>
      </div>
    </div>
  );
}
