-- Function to update user location from Mobile App
create or replace function public.update_location(lat float, lng float)
returns void as $$
begin
  update public.profiles 
  set current_location = st_point(lng, lat)::geography, 
      is_online = true
  where id = auth.uid();
end;
$$ language plpgsql security definer;
