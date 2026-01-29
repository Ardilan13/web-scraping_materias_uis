import json
import os

# --- CONFIGURACIÓN ---
INPUT_FILE = 'merged_subjects.json'       
COLLECTION = 'subjects'
OUTPUT_FILE = '009_migration_data_subjects.yaml'
VERIFY_DIR = 'temp'
VERIFY_FILE = os.path.join(VERIFY_DIR, 'subjects_reconstructed.json')
BATCH_SIZE = 100 

def generate_safe_yaml_with_verification():
    if not os.path.exists(INPUT_FILE):
        print(f"❌ No se encuentra el archivo de entrada: {INPUT_FILE}")
        return

    try:
        print(f"📖 Leyendo {INPUT_FILE}...")
        with open(INPUT_FILE, 'r', encoding='utf-8-sig') as f:
            content = f.read().strip()
            if not content.startswith('['): 
                content = f"[{content.replace('}', '},').rstrip(',')}]"
            data = json.loads(content)

        input_count = len(data)
        print(f"✅ Registros leídos en origen: {input_count}")

        processed_data = []

        print(f"⚙️  Generando YAML en {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='ascii') as f: 
            f.write("databaseChangeLog:\n")
            
            for i in range(0, input_count, BATCH_SIZE):
                batch = data[i:i + BATCH_SIZE]
                
                processed_data.extend(batch)
                
                batch_json = json.dumps(batch, ensure_ascii=True)
                
                f.write(f"  - changeSet:\n")
                f.write(f"      id: import-{COLLECTION}-batch-{i//BATCH_SIZE + 1}\n")
                f.write(f"      author: dilan-corredor\n")
                f.write(f"      changes:\n")
                f.write(f"        - insertMany:\n")
                f.write(f"            collectionName: {COLLECTION}\n")
                f.write(f"            documents: >-\n")
                f.write(f"              {batch_json}\n\n")

        if not os.path.exists(VERIFY_DIR):
            os.makedirs(VERIFY_DIR)
            
        print(f"💾 Creando archivo de control en {VERIFY_FILE}...")
        with open(VERIFY_FILE, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, indent=2, ensure_ascii=False)

        output_count = len(processed_data)
        
        print("\n" + "="*40)
        print("📊 REPORTE DE EJECUCIÓN")
        print("="*40)
        print(f"Entrada: {input_count} documentos")
        print(f"Salida:  {output_count} documentos")
        
        if input_count == output_count:
            print("\n✅ ¡ÉXITO TOTAL! La cantidad de documentos coincide.")
            print(f"   Revisa la carpeta '{VERIFY_DIR}' para validar los datos.")
        else:
            print(f"\n⚠️ ALERTA: Hay una diferencia de {input_count - output_count} documentos.")

    except Exception as e:
        print(f"\n❌ Error fatal durante el proceso: {e}")

if __name__ == "__main__":
    generate_safe_yaml_with_verification()