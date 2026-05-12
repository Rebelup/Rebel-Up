-- 새 브랜드 추가: 마이프로틴, BSN, 삼대오백, 나우푸드
INSERT INTO public.supplement_brands (name, slug, website_url, events_url)
VALUES
  ('마이프로틴', 'myprotein', 'https://kr.myprotein.com', 'https://kr.myprotein.com/html/promotions.html'),
  ('BSN', 'bsn', 'https://www.bsnprotein.com', 'https://www.bsnprotein.com/pages/promotions'),
  ('삼대오백', 'samdae500', 'https://samdae500.com', 'https://samdae500.com/pages/event'),
  ('나우푸드', 'nowfoods', 'https://www.nowfoods.com', 'https://www.nowfoods.com/sale')
ON CONFLICT (slug) DO NOTHING;
