-- Beispiel-Mitglied (Bien-Air) zum Testen des Portals.
-- Nach den Migrationen ausführen.

insert into public.members
  (name, description, address, website_url, lat, lng, canton, source_lang)
values
  (
    'Bien-Air Dental SA',
    jsonb_build_object(
      'en', 'Bien-Air Dental offers a comprehensive product range in dental medicine. The reputation of Bien-Air reaches beyond implant systems, straight and contra-angle hand-pieces and turbines; the company is the world''s largest manufacturer of top-quality micromotors.',
      'de', 'Bien-Air Dental offers a comprehensive product range in dental medicine. The reputation of Bien-Air reaches beyond implant systems, straight and contra-angle hand-pieces and turbines; the company is the world''s largest manufacturer of top-quality micromotors.',
      'fr', 'Bien-Air Dental offers a comprehensive product range in dental medicine. The reputation of Bien-Air reaches beyond implant systems, straight and contra-angle hand-pieces and turbines; the company is the world''s largest manufacturer of top-quality micromotors.',
      'it', 'Bien-Air Dental offers a comprehensive product range in dental medicine. The reputation of Bien-Air reaches beyond implant systems, straight and contra-angle hand-pieces and turbines; the company is the world''s largest manufacturer of top-quality micromotors.'
    ),
    'BIEN-AIR DENTAL TECHNOLOGIES, Länggasse 60, Cases Postale, 2500 Bienne 6',
    'https://dental.bienair.com/',
    47.1368, 7.2468, 'BE', 'en'
  );
