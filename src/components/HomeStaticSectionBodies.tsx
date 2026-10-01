import React from 'react';
import Link from 'next/link';
import { optimizeImageUrl, generateSlug, generateSrcSet, formatVietnamDate } from '../lib/utils';
import { Compass, Shield, Award, ChevronRight, Layers, Building2, MapPin, Calendar } from 'lucide-react';
import type { Project, News, VisualSection } from '../types';
import { EditableText } from './EditableComponent';

interface SectionRendererProps {
  sec: VisualSection;
  isEditMode: boolean;
  sections: VisualSection[];
  onUpdateSections: (sections: VisualSection[]) => void;
}

export interface HomeStaticSectionEntry {
  section: VisualSection;
  content: React.ReactNode;
}
export type HomeStaticSectionContent = Record<string, HomeStaticSectionEntry>;

// Khối giới thiệu doanh nghiệp.
export const CorporateIntroBody: React.FC<SectionRendererProps> = ({
  sec,
  isEditMode,
  sections,
  onUpdateSections
}) => {
  return (
    <section className="bg-bg-surface border-b border-border-color pt-[10px] pb-[20px] font-sans" id="home-corporate-intro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[20px]">
        <div className="text-center space-y-3 max-w-xl mx-auto mb-16">
          <EditableText
            sectionId="corporate_intro"
            field="title"
            value={sec.title}
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-3xl font-display font-medium text-primary tracking-tight text-center"
            tag="h2"
          />
          <EditableText
            sectionId="corporate_intro"
            field="description"
            value={sec.description}
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            isArea
            className="text-text-secondary text-xs text-center"
            tag="p"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Tầm nhìn. */}
          <div className="motion-card bg-bg-surface border border-border-color p-[12px] rounded-xl hover:border-primary/30 hover:bg-bg-surface shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Compass className="w-24 h-24" />
            </div>
            <div className="w-[35px] h-[35px] mb-[10px] bg-emerald-50 border border-emerald-100 text-primary flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <EditableText
              sectionId="corporate_intro"
              field="extraData"
              subField="visionTitle"
              value={sec.extraData?.visionTitle || 'Tầm Nhìn Sứ Mệnh'}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="font-display font-bold text-lg text-primary mb-[5px]"
              tag="h3"
            />
            <EditableText
              sectionId="corporate_intro"
              field="extraData"
              subField="visionDesc"
              value={sec.extraData?.visionDesc || ''}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea
              className="text-text-secondary text-xs font-light leading-relaxed"
              tag="p"
            />
          </div>

          {/* Chiến lược. */}
          <div className="motion-card bg-bg-surface border border-border-color p-[12px] rounded-xl hover:border-primary/30 hover:bg-bg-surface shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-24 h-24" />
            </div>
            <div className="w-[35px] h-[35px] mb-[10px] bg-emerald-50 border border-emerald-100 text-primary flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <EditableText
              sectionId="corporate_intro"
              field="extraData"
              subField="strategyTitle"
              value={sec.extraData?.strategyTitle || 'Chiến Lược Phát Triển'}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="font-display font-bold text-lg text-primary mb-[5px]"
              tag="h3"
            />
            <EditableText
              sectionId="corporate_intro"
              field="extraData"
              subField="strategyDesc"
              value={sec.extraData?.strategyDesc || ''}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea
              className="text-text-secondary text-xs font-light leading-relaxed"
              tag="p"
            />
          </div>

          {/* Quy trình làm việc. */}
          <div className="motion-card bg-bg-surface border border-border-color pt-[12px] pl-[11px] pr-[12px] pb-[10px] rounded-xl hover:border-primary/30 hover:bg-bg-surface shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Award className="w-24 h-24" />
            </div>
            <div className="w-[35px] h-[35px] mb-[10px] bg-emerald-50 border border-emerald-100 text-primary flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <EditableText
              sectionId="corporate_intro"
              field="extraData"
              subField="processTitle"
              value={sec.extraData?.processTitle || 'Quy Trình Nghiệp Vụ'}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="font-display font-bold text-lg text-primary mb-[5px]"
              tag="h3"
            />
            <EditableText
              sectionId="corporate_intro"
              field="extraData"
              subField="processDesc"
              value={sec.extraData?.processDesc || ''}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea
              className="text-text-secondary text-xs font-light leading-relaxed"
              tag="p"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Khối lý do lựa chọn.
export const ReasonsBody: React.FC<SectionRendererProps> = ({
  sec,
  isEditMode,
  sections,
  onUpdateSections
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-none font-sans pb-[10px] sm:pb-0" id="home-reasons-choose">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 items-center">
        <div className="md:col-span-1 lg:col-span-6 space-y-6 text-left">
          <EditableText
            sectionId="reasons"
            field="title"
            value={sec.title}
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-[25px] font-display font-medium text-primary tracking-tight leading-tight"
            tag="h2"
          />
          <EditableText
            sectionId="reasons"
            field="description"
            value={sec.description}
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            isArea
            className="text-text-secondary text-sm leading-relaxed font-light"
            tag="p"
          />

          <div className="space-y-6 pt-[0px] w-full sm:max-w-[360px] md:max-w-none">
            <div className="flex items-start gap-4 p-[10px] mb-[5px] rounded-xl hover:bg-bg-surface transition-colors border border-transparent hover:border-border-color">
              <div className="bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold font-mono text-sm shrink-0 border border-emerald-100 shadow-inner">01</div>
              <div>
                <EditableText
                  sectionId="reasons"
                  field="extraData"
                  subField="item1Title"
                  value={sec.extraData?.item1Title || 'Bảo mật thông tin tối thượng'}
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  className="text-primary text-base font-medium tracking-wide"
                  tag="h3"
                />
                <EditableText
                  sectionId="reasons"
                  field="extraData"
                  subField="item1Desc"
                  value={sec.extraData?.item1Desc || ''}
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  isArea
                  className="text-text-secondary text-xs font-light mt-1.5 leading-relaxed"
                  tag="p"
                />
              </div>
            </div>

            <div className="flex items-start gap-4 p-[10px] mb-[10px] rounded-xl hover:bg-bg-surface transition-colors border border-transparent hover:border-border-color">
              <div className="bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold font-mono text-sm shrink-0 border border-emerald-100 shadow-inner">02</div>
              <div>
                <EditableText
                  sectionId="reasons"
                  field="extraData"
                  subField="item2Title"
                  value={sec.extraData?.item2Title || 'Tập trung rạch ròi mảng xanh'}
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  className="text-primary text-base font-medium tracking-wide"
                  tag="h3"
                />
                <EditableText
                  sectionId="reasons"
                  field="extraData"
                  subField="item2Desc"
                  value={sec.extraData?.item2Desc || ''}
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  isArea
                  className="text-text-secondary text-xs font-light mt-1.5 leading-relaxed"
                  tag="p"
                />
              </div>
            </div>

            <div className="flex items-start gap-4 p-[10px] rounded-xl hover:bg-bg-surface transition-colors border border-transparent hover:border-border-color">
              <div className="bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold font-mono text-sm shrink-0 border border-emerald-100 shadow-inner">03</div>
              <div>
                <EditableText
                  sectionId="reasons"
                  field="extraData"
                  subField="item3Title"
                  value={sec.extraData?.item3Title || 'Thủ tục pháp lý mượt mà'}
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  className="text-primary text-base font-medium tracking-wide"
                  tag="h3"
                />
                <EditableText
                  sectionId="reasons"
                  field="extraData"
                  subField="item3Desc"
                  value={sec.extraData?.item3Desc || ''}
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  isArea
                  className="text-text-secondary text-xs font-light mt-1.5 leading-relaxed"
                  tag="p"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 lg:col-span-6 grid grid-cols-2 gap-4 w-full lg:max-w-[475px] lg:mx-auto" id="numbers-choose">
          <div className="bg-bg-surface p-[10px] sm:p-[12px] w-full h-auto sm:min-h-[195px] lg:min-h-[160px] rounded-2xl border border-border-color shadow-xl space-y-3 text-left hover:border-emerald-500/30 transition-colors col-span-1">
            <EditableText
              sectionId="reasons"
              field="extraData"
              subField="stat1Val"
              value={sec.extraData?.stat1Val || '1,500+'}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-[20px] sm:text-[30px] font-bold font-display text-primary inline-block mb-1"
              tag="h3"
            />
            <EditableText
              sectionId="reasons"
              field="extraData"
              subField="stat1Label"
              value={sec.extraData?.stat1Label || 'Khách Hàng Hài Lòng'}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="mb-[5px] sm:mb-0 text-primary tracking-widest uppercase text-[9px] sm:text-[10px] font-bold"
              tag="p"
            />
            <EditableText
              sectionId="reasons"
              field="extraData"
              subField="stat1Desc"
              value={sec.extraData?.stat1Desc || ''}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea
              className="text-text-secondary text-[10px] sm:text-xs font-light leading-relaxed pt-[5px] sm:pt-2"
              tag="p"
            />
          </div>

          <div className="bg-bg-surface p-[10px] sm:p-[12px] w-full h-auto sm:min-h-[195px] lg:min-h-[160px] rounded-2xl border border-border-color shadow-xl space-y-3 text-left hover:border-emerald-500/30 transition-colors col-span-1">
            <EditableText
              sectionId="reasons"
              field="extraData"
              subField="stat2Val"
              value={sec.extraData?.stat2Val || '98.8%'}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-[20px] sm:text-[30px] font-bold font-display text-primary inline-block mb-1"
              tag="h3"
            />
            <EditableText
              sectionId="reasons"
              field="extraData"
              subField="stat2Label"
              value={sec.extraData?.stat2Label || 'Bàn giao chuẩn chỉ pháp lý'}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="mb-[5px] sm:mb-0 text-primary tracking-widest uppercase text-[9px] sm:text-[10px] font-bold"
              tag="p"
            />
            <EditableText
              sectionId="reasons"
              field="extraData"
              subField="stat2Desc"
              value={sec.extraData?.stat2Desc || ''}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea
              className="text-text-secondary text-[10px] sm:text-xs font-light leading-relaxed pt-[5px] sm:pt-2"
              tag="p"
            />
          </div>

          <div className="bg-bg-surface p-[10px] sm:p-[12px] w-full lg:h-[146px] rounded-2xl border border-border-color shadow-xl space-y-3 text-left col-span-2 hover:border-emerald-500/30 transition-colors">
            <EditableText
              sectionId="reasons"
              field="extraData"
              subField="stat3Val"
              value={sec.extraData?.stat3Val || '0% lo ngại'}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-[25px] sm:text-[30px] font-bold font-display text-primary inline-block mb-1"
              tag="h3"
            />
            <EditableText
              sectionId="reasons"
              field="extraData"
              subField="stat3Label"
              value={sec.extraData?.stat3Label || 'Giải pháp độc quyền phong thủy'}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="mb-[5px] sm:mb-0 text-primary tracking-widest uppercase text-[10px] font-bold"
              tag="p"
            />
            <EditableText
              sectionId="reasons"
              field="extraData"
              subField="stat3Desc"
              value={sec.extraData?.stat3Desc || ''}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea
              className="text-text-secondary text-[10px] sm:text-xs font-light leading-relaxed pt-[5px] sm:pt-2 max-w-lg"
              tag="p"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Khối dự án.
interface ProjectsProps extends SectionRendererProps {
  projects: Project[];
}

export const ProjectsBody: React.FC<ProjectsProps> = ({
  sec,
  isEditMode,
  sections,
  onUpdateSections,
  projects
}) => {
  const visibleProjects = Array.from(
    new Map(projects.map((project) => [project.id || generateSlug(project.title), project])).values(),
  ).slice(0, 5);
  const projectSlides = visibleProjects.length >= 4
    ? [...visibleProjects, ...visibleProjects]
    : visibleProjects;

  return (
    <section className="bg-bg-surface border-y border-border-color py-1 font-sans" id="home-swiper-projects">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-[25px]">
        <div className="flex flex-row items-center justify-between gap-4 text-left">
          <div>
            <EditableText
              sectionId="projects"
              field="title"
              value={sec.title === 'Khu Đại Đô Thị Nổi Bật' ? 'Dự Án Nổi Bật' : sec.title}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-2xl sm:text-3xl font-display font-medium text-primary tracking-tight"
              tag="h2"
            />
            <EditableText
              sectionId="projects"
              field="description"
              value={sec.description}
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea
              className="text-text-secondary text-xs font-light"
              tag="p"
            />
          </div>

        <div className="flex items-center shrink-0">
          <Link
            href="/du-an"
            prefetch={false}
            className="text-primary hover:text-primary font-sans text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            Xem thêm <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
        </div>

        {visibleProjects.length === 0 ? (
          <div className="text-white/70 text-xs py-6 text-center">Chưa có dự án nào được cập nhật.</div>
        ) : (
          <div className="relative overflow-hidden py-4 w-full">
            <div className={`${visibleProjects.length >= 4 ? 'animate-sliding-container' : ''} flex w-max`}>
              <div className={`flex w-max ${visibleProjects.length >= 4 ? 'animate-slider-projects' : ''}`}>
                {projectSlides.map((proj, idx) => (
                  <Link
                    key={`${proj.id}-${idx}`}
                    aria-hidden={idx >= visibleProjects.length}
                    tabIndex={idx >= visibleProjects.length ? -1 : undefined}
                    href={`/du-an/${generateSlug(proj.title)}`}
                    prefetch={false}
                    data-content-link="project"
                    className="motion-card w-[260px] sm:w-[280px] md:w-[240px] lg:w-[223px] shrink-0 mr-4 lg:mr-5 bg-bg-surface hover:bg-bg-surface border border-border-color hover:border-primary/30 shadow-md rounded-lg overflow-hidden group cursor-pointer flex flex-col justify-between block"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img loading="lazy" decoding="async"
                        src={optimizeImageUrl(proj.imageUrl || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800", 400) || undefined}
                        srcSet={generateSrcSet(proj.imageUrl || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800")}
                        sizes="(max-width: 767px) 260px, (max-width: 1023px) 240px, 223px"
                        alt={proj.title}
                        width="800"
                        height="500"
                        referrerPolicy="no-referrer"
                        className="motion-media w-full h-full object-cover group-hover:scale-105"
                      />
                      <div className="absolute top-0 left-0 px-2.5 py-1 bg-success text-white text-[11px] font-bold rounded-none rounded-br-lg shadow-sm z-10">
                        {proj.status === 'handed_over' ? 'Đã bàn giao' : proj.status === 'coming_soon' ? 'Sắp ra mắt' : 'Đang mở bán'}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-[13px] sm:text-[15px] font-bold text-text-primary mb-2 line-clamp-2 transition-colors group-hover:text-primary">
                          {proj.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-text-secondary">Giá từ:</span>
                          <span className="text-primary font-bold text-[13px]">{proj.priceText || "Đang cập nhật"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-text-secondary mb-2">
                          <div className="flex items-center gap-1.5 flex-1">
                            <Layers className="w-3 h-3 text-text-secondary shrink-0" />
                            <span className="truncate" title={proj.scale || 'Đang cập nhật'}>{proj.scale || 'Đang cập nhật'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-1">
                            <Building2 className="w-3 h-3 text-text-secondary shrink-0" />
                            <span className="truncate" title={proj.units ? String(proj.units) : 'Đang cập nhật'}>{proj.units ? `${proj.units} căn` : 'Đang cập nhật'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-text-secondary mt-auto pt-2 border-t border-border-color/50">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-[1px]" />
                        <span className="line-clamp-2">
                          {proj.location || proj.title}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// Khối tin tức.
interface NewsProps extends SectionRendererProps {
  news: News[];
}

export const NewsBody: React.FC<NewsProps> = ({
  sec,
  isEditMode,
  sections,
  onUpdateSections,
  news
}) => {
  const visibleNews = Array.from(
    new Map(news.map((article) => [article.id || generateSlug(article.title), article])).values(),
  ).slice(0, 5);
  const newsSlides = visibleNews.length >= 4
    ? [...visibleNews, ...visibleNews]
    : visibleNews;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 font-sans" id="home-swiper-news">
      <div className="flex flex-row items-center justify-between gap-4 text-left">
        <div>
          <EditableText
            sectionId="news"
            field="title"
            value={sec.title === 'Kinh Nghiệm & Phân Tích Địa Ốc' ? 'Tin tức & Sự kiện' : sec.title}
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-2xl sm:text-3xl font-display font-medium text-primary tracking-tight"
            tag="h2"
          />
          <EditableText
            sectionId="news"
            field="description"
            value={sec.description === 'Tin nhanh vi mô và phong thủy phong phú cung cấp từ đội ngũ biên soạn Greenia.' ? 'Cập nhận tin tức, sự kiện mới nhất trong thị trường BĐS tại Tp HCM và khu vực lân cận' : sec.description}
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            isArea
            className="text-text-secondary text-xs font-light"
            tag="p"
          />
        </div>

        <div className="flex items-center shrink-0">
          <Link
            href="/tin-tuc"
            prefetch={false}
            className="text-primary hover:text-primary font-sans text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            Xem thêm <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
      </div>

      {visibleNews.length === 0 ? (
        <div className="text-white/70 text-xs py-6 text-center">Chưa có tin tức nào được cập nhật.</div>
      ) : (
        <div className="relative overflow-hidden py-4 w-full">
          <div className={`${visibleNews.length >= 4 ? 'animate-sliding-container' : ''} flex w-max`}>
            <div className={`flex w-max ${visibleNews.length >= 4 ? 'animate-slider-news' : ''}`}>
              {newsSlides.map((article, idx) => (
                <Link
                  key={`${article.id}-${idx}`}
                  aria-hidden={idx >= visibleNews.length}
                  tabIndex={idx >= visibleNews.length ? -1 : undefined}
                  href={`/tin-tuc/${generateSlug(article.title)}`}
                  prefetch={false}
                  data-content-link="news"
                  className="motion-card w-[260px] sm:w-[280px] md:w-[240px] lg:w-[223px] shrink-0 mr-4 lg:mr-5 bg-bg-surface hover:bg-bg-surface border border-border-color hover:border-primary/30 shadow-md rounded-lg overflow-hidden group cursor-pointer flex flex-col justify-between block"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img loading="lazy" decoding="async"
                      src={optimizeImageUrl(article.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800", 400) || undefined}
                      srcSet={generateSrcSet(article.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800")}
                      sizes="(max-width: 767px) 260px, (max-width: 1023px) 240px, 223px"
                      alt={article.title}
                      width="800"
                      height="500"
                      referrerPolicy="no-referrer"
                      className="motion-media w-full h-full object-cover group-hover:scale-105"
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[8px] text-slate-505 font-mono">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{formatVietnamDate(article.createdAt)}</span>
                      </div>
                      <h3 className="font-display font-medium text-xs text-primary group-hover:text-primary transition-colors line-clamp-2 leading-relaxed h-8">
                        {article.title}
                      </h3>
                      <p className="text-text-secondary text-[10px] font-light line-clamp-2 leading-relaxed h-11">
                        {article.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border-color flex items-center justify-between text-[9px] text-white/70">
                      <span></span>
                      <span className="text-primary font-bold shrink-0">Xem thêm →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export function createHomeStaticSectionContent(
  sections: VisualSection[], projects: Project[], news: News[],
): HomeStaticSectionContent {
  const content: HomeStaticSectionContent = {};
  for (const section of sections) {
    if (!section.visible) continue;
    const sec = sections.find(item => item.id === section.id) || section;
    // Các callback chỉnh sửa không chạy khi dựng nội dung công khai tại máy chủ.
    const props = { sec, isEditMode: false, sections, onUpdateSections: () => {} };
    let body: React.ReactNode;
    switch (section.id) {
      case 'corporate_intro': body = <CorporateIntroBody {...props} />; break;
      case 'reasons': body = <ReasonsBody {...props} />; break;
      case 'projects': body = <ProjectsBody {...props} projects={projects} />; break;
      case 'news': body = <NewsBody {...props} news={news} />; break;
      default: continue;
    }
    content[section.id] = { section, content: body };
  }
  return content;
}
