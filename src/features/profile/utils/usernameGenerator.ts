import { supabase } from '../../../lib/supabase';

export async function generateUniqueUsername(base: string): Promise<string> {
  const cleanBase = base.toLowerCase().replace(/[^a-z0-9_]/g, '');
  let username = cleanBase.slice(0, 15); // keep it within limits so we can append numbers
  
  if (!username) username = 'user';

  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
        
      if (error) throw error;
      
      if (!data) {
        isUnique = true;
      } else {
        // Appends a random 3-4 digit number
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        username = `${cleanBase.slice(0, 15)}_${randomNum}`.slice(0, 20); // ensure it stays under 20
      }
    } catch (e) {
      console.error('Error checking username uniqueness', e);
      break; // fail safe
    }
    attempts++;
  }
  
  return username;
}
