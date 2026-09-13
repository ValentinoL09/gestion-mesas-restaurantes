-- ============================================================
-- 0009_storage_logos_politicas.sql
-- Políticas del bucket público 'logos' para el auto-servicio de marca.
-- La ruta de cada objeto es: logos/{restauranteID}/logo
-- Solo el dueño del restaurante puede subir/reemplazar/borrar su logo;
-- la lectura es pública (bucket público), el comensal la consume siempre.
-- ============================================================

-- ---------- 1) Lectura pública ----------
drop policy if exists "logos_lectura_publica" on storage.objects;
create policy "logos_lectura_publica" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'logos');

-- ---------- 2) Alta del logo (solo el dueño del restaurante) ----------
drop policy if exists "logos_insert_dueño" on storage.objects;
create policy "logos_insert_dueño" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (
      (storage.foldername(name))[1] is not null
      and exists (
        select 1 from public.restaurantes r
        where r.id = (storage.foldername(name))[1]::uuid
          and r.usuario_id = auth.uid()
      )
    )
  );

-- ---------- 3) Reemplazo y borrado del logo (solo el dueño) ----------
drop policy if exists "logos_update_dueño" on storage.objects;
create policy "logos_update_dueño" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] is not null
    and exists (
      select 1 from public.restaurantes r
      where r.id = (storage.foldername(name))[1]::uuid
        and r.usuario_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] is not null
    and exists (
      select 1 from public.restaurantes r
      where r.id = (storage.foldername(name))[1]::uuid
        and r.usuario_id = auth.uid()
    )
  );

drop policy if exists "logos_delete_dueño" on storage.objects;
create policy "logos_delete_dueño" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] is not null
    and exists (
      select 1 from public.restaurantes r
      where r.id = (storage.foldername(name))[1]::uuid
        and r.usuario_id = auth.uid()
    )
  );