(function(root){
  const config=Object.freeze({
    url:'https://gxbqyhecrdbnuzejxecx.supabase.co',
    anonKey:'sb_publishable_YdTwx79YnYg8QXkkhqxdww_x76Ys2gG'
  });
  root.EH_SUPABASE_CONFIG=config;
  root.createEHSupabaseClient=function(){
    if(!config.url||!config.anonKey)throw new Error('Konfigurasi Supabase publik belum diisi di js/supabase.js.');
    if(!root.supabase?.createClient)throw new Error('Library Supabase tidak dapat dimuat. Periksa koneksi internet.');
    return root.supabase.createClient(config.url,config.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  };
})(window);
