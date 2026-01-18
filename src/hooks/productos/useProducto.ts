//hook para obtener los productos 
import { supabase } from "@/lib/supabase";

export async function getProductos() {
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*');
    
    if (error) {
        return []
    }

    return productos; 
}