--- 
title: Como hacer un Backup de tus archivos. Cifrar, comprimir, Sincronizar y mas cosas.
date: 2025-11-09 11:29 
layout: post
categories: [Forense] 
---

¿Recuerdas esa escena de _Mr. Robot_ donde Elliot guarda datos en CDs, los etiqueta como álbumes de música y los esconde en un estuche? Más allá de la paranoia de la serie, hay una lección importante ahí: **la privacidad y la persistencia de los datos.**

Ya sea porque eres una persona que formatea contantemente o cambias de distribucion a menudo, porque temes al ransomware, o simplemente porque quieres que tus documentos perduren en el tiempo de forma segura, necesitas una estrategia de backup sólida.

Hoy no vamos a hacer un simple "copiar y pegar". Hoy vamos a construir un búnker digital utilizando dos herramientas legendarias en el mundo Linux: #Rsync y #BorgBackup
# ¿Como lo vamos a hacer, y por que?
En este blog, los que ya habeis leido las entradas recientes, no hablo de aquellas que mantengo de 2012. Si no las anteriores que empeze a publicar en 2025. Habreis visto que este blog no es un lugar donde encontrar al menos solo, tutoriales. A mi me gusta explicar el razonmiento detras de cada cosa. El por que lo hacemos asi, Por que funciona asi.... 

Vamos a explicar las herramientas que vamos a utilizar;
#Borg, #Rsync, #vorta,  python-llfuse

```bash
# Para esto vamos a instalar ya del tiron nuestras herramientas.
# Opcionalmente puedes instalar vorta que es borg gui. (Aqui no lo vamos a usar)
sudo pacman -Syy borg rsync python-llfuse
```

## Por qué #Rsync?
Inicialmente podriamos pensar que podriamos simplemente hacer control + C & control + V para mover archivos de un lado a otro y ahorrarnos una herramienta y unos comandos y hasta un proceso mas largo que el de copiar en un gestor de archivos. Si, Podriamos. Pero...
Estamos realizando un backup y aunque en este articulo utilizaremos ejemplos de la vida cotidiana como mover la carpeta documentos y hacer una copia de seguridad. Esto en un entorno profesional marca la diferencia.  Hoy os enseñare a tratar los datos como si fueran ORO. Nuestra carpeta de documentos es ORO. Nuestro ORO... Y los vamos a tratar de una forma en la que evitaremos copiar 2 veces el mismo archivo y evitaremos corrupciones y otras muchas cosas. Imagina que se te va la luz en medio del proceso. Con Rsync solucionas el problema. Ahora lo vemos.
### Algoritmo Delta: Copiar sin copiar
La gran magia de Rsync reside en su algoritmo de transferencia delta. Cuando le pides a Rsync que actualice un archivo, no se limita a borrar el viejo y escribir el nuevo. Rsync divide el archivo en bloques, calcula firmas matemáticas (checksums) y compara el origen con el destino.
* **El resultado:** Si tienes una carpeta con 10Gb de archivos, y solo cambiaste 1. En vez de tratar de mover y sobreescribir el los 10Gb y terminar dandole a Skip all. Rsync calculara todos los datos de la carpeta y encontrara la diferencia. evitando tener que mover 10Gb. Y copiando unicamente ese archivo nuevo. Esto ahorra tiempo y disco.
### Preservación Forense (`-a` Archive)
Para una copia de seguridad, el contenido del archivo es tan importante como sus #metadatos. Si usas un copiado normal, a menudo la "Fecha de Modificación" se cambia al momento actual y los permisos de usuario se pierden.
Rsync, con su flag `-a` (Archive), preserva estrictamente:
* Permisos de lectura/escritura.
* Propietario y Grupo (Owner/Group).
* Fechas de modificación (Timestamps).
* Enlaces simbólicos.
Esto garantiza que la copia sea un clon funcional, no solo un montón de datos.
### Lógica de Fusión (`-u` Update)
En nuestro caso de recuperación, teníamos un dilema: mezclar archivos recuperados de un backup antiguo con archivos actuales. Rsync nos ofrece el flag `-u`, que aplica una lógica simple pero vital: **"Si el archivo ya existe en el destino, solo sobrescríbelo si el del origen es MÁS NUEVO"**.
Esto nos permite volcar terabytes de datos viejos sobre datos nuevos sin miedo a retroceder en el tiempo y perder trabajo reciente.

### Otras utilidades "Ninja" de Rsync
Aunque hoy lo usaremos para fusionar carpetas localmente, Rsync es una navaja suiza:
* **Mirroring Exacto (`--delete`):** Permite crear espejos exactos. Si borras un archivo en el origen, Rsync lo borra en el destino. Ideal para clonar discos.
* **Transporte Seguro por Red:** Rsync funciona nativamente sobre SSH. Puedes sincronizar tu carpeta local con un servidor en Alemania con la misma facilidad que con un USB.
* **Reanudación (`--partial`):** Si estás pasando 500GB y se va la luz, Rsync puede continuar exactamente donde se quedó, sin empezar de cero.

**En resumen:** Usamos Rsync antes que Borg para "sanear" y unificar nuestros datos dispersos, asegurando que lo que entra en la bóveda de seguridad es la versión más perfecta, reciente y ordenada de nuestra información.

## ¿Por qué #BorgBackup? 
Hasta el momento hemos hablado de Rsync, Que nos ayudara a tratar los datos como se deben tratar. Son los reyes de nuestro sistema. Podemos decir que si Los datos son los muebles de nuestro sistema. Rsync es la empresa de mudanzas que embala y mueve correctamente nuestros muebles. Pero ahora falta meterlos al camion y que todos quepan.
¿Verdad?. Pues aqui entra borgBackup.

### Deduplicación a Nivel de Bloque
Aquí es donde Borg brilla con luz propia. La mayoría de los programas de backup miran la fecha de un archivo: si ha cambiado, lo copian entero otra vez. Borg no.

Borg utiliza un algoritmo de **"Content-Defined Chunking"**.
* No ve archivos, ve "pedazos" de datos (chunks).
* Antes de guardar nada, calcula la huella digital (hash) de cada pedazo.
* **La Magia:** Si haces un backup de una máquina virtual de 50GB hoy, y mañana cambias un solo archivo de texto dentro de ella, Borg detecta que el 99.9% de los "chunks" ya existen en el repositorio. Solo guardará y transmitirá los pocos bytes nuevos.
* **Resultado:** Puedes almacenar copias diarias de tus datos durante años ocupando apenas una fracción del espacio real.
### Cifrado "Zero-Knowledge" (AES-256)
Borg fue diseñado con la premisa de que **no puedes confiar en el lugar donde guardas los datos**. Ya sea un servidor en la nube o un USB que puedes perder en el tren.
* **Encriptación del lado del cliente:** Los datos se cifran (AES-256) y se firman (HMAC) **antes** de salir de tu CPU.
* El disco de destino nunca ve tus archivos, solo ve bloques de datos cifrados ilegibles. Sin tu contraseña (o llave), ese disco es un pisapapeles.
### Montaje FUSE
Hay miles de formas de hacer un Backup. A mí me gusta esta... Todos hemos sufrido eso de... Tener un archivo comprimido, con contraseña. Que además hemos "megacomprimido" y descomprimirlo tarda tiempo...
Bueno, con Borg tenemos **FUSE** (Filesystem in Userspace). Esto nos permite montar nuestros backups como un sistema de archivos virtual. Para que lo entiendas: **como si fuera un USB**.
Puedes navegar por tus backups sin necesidad de descomprimir. Puedes coger ese archivo que necesitabas del backup, simplemente copiarlo a tu usuario y, al desmontarlo... *Pups*, ni rastro.
### Compresión ZSTD
Borg permite elegir algoritmos modernos. Usando **ZSTD** (Zstandard), conseguimos velocidades de descompresión altísimas con ratios de reducción de espacio excelentes.. Como ejemplo uno de mis backups tiene un peso total de 52Gb, y el backup ocupa apenas 19Gb. Una reduccion importante.

### Vorta (GUI).
Aunque en este artículo nos centramos en la terminal para entender la base, es justo mencionar **Vorta**.
Vorta es la interfaz grafica (GUI) de BORG. No es un programa distinto. Es la version GUI.
Esto es para quien ya entiende BORG, y tiene muchas copias de seguridad esto es como Keepass. Un administrador grafico. Permite crear copias automaticas, administrar los backups...  Es simplemente un GUI que facilita hacer ciertos trabajos.

# ¿Entonces por que usamos Rsync y Borg?
Es posible que te estés preguntando: *"Si Borg ya detecta cambios y solo guarda lo nuevo... ¿Para qué hemos perdido el tiempo usando Rsync antes?"*.
**La respuesta tiene dos partes: una práctica para hoy, y una estratégica para mañana.**

### La razón Práctica: Poner orden en el caos
En nuestro ejemplo, tenemos dos carpetas en conflicto: una copia vieja recuperada y nuestra carpeta de trabajo actual.
* **Si hubiéramos usado solo Borg:** Habríamos guardado ambas carpetas, pero seguiríamos teniendo los archivos duplicados y desordenados.
* **Al usar Rsync:** Lo utilizamos como una "mesa de mezclas". Rsync comparó ambas carpetas y, gracias a su inteligencia, fusionó la carpeta viejas con la nueva sin sobrescribir mi trabajo reciente.
Rsync nos entregó una carpeta limpia y perfecta, lista para que Borg la protegiera.

### La razón Estratégica: El Organizador Universal
He querido introducir Rsync porque es la herramienta definitiva para **estandarizar** tus copias antes de guardarlas, vengan de donde vengan.

Imagina que administras un servidor o un VPS. A veces descargarás los datos comprimidos en un `.zip`, otras por FTP o clonarás un repositorio. ¿Qué haces con eso? No vas a meter el `.zip` sin más al backup. Lo descomprimes y usas **Rsync en local** para sincronizarlo con tu carpeta maestra.

Esto es vital para el **ciclo de vida del dato**:
Imagina que descargas un ZIP con tus "Documentos" de hoy. En esta versión nueva, has borrado la carpeta "Fotos" y has modificado varios excels.
Si hicieras un copiado simple, borrarías las fotos de tu backup.
Al usar Rsync de forma acumulativa (sin borrar), conseguimos una **máquina del tiempo**:
1.  Los archivos nuevos del ZIP se añaden.
2.  Los archivos modificados se actualizan.
3.  **Lo vital:** La carpeta "Fotos" antigua, aunque ya no venga en el ZIP, **SE QUEDA** en tu backup.

Así, tu repositorio siempre crece y nunca olvida. Aunque en tu servidor actual ya no existan esas fotos, en tu backup local seguirán ahí por si algún día las necesitas.

# ¡Manos a la obra! La Práctica

Ya he soltado mi chapa teorica de las razones por las que utilizamos estas 2 herramientas, en vez de otras o un simple arrastrar. **Ahora vamos a ejercitar esas manos llenas de artritis!**

Supongamos el escenario que comentábamos antes:
1. Tienes tu carpeta actual: `~/Documentos/`
2. Tienes un USB con archivos viejos: `/run/media/usb/Documentos/`
3. Quieres guardarlo todo en un disco duro externo donde vivirá nuestro repositorio Borg: `/mnt/DiscoExterno/`

## Paso 1: La fusion de carpetas
Primero, traigamos los datos del USB a tu carpeta local, pero **solo** lo que no tengas ya o lo que sea más nuevo.
```bash
rsync -auvh --progress /run/media/usb/Documentos/ ~/Documentos/
```
**Vamos esas flags:**
- `-a`: "Trátalo como archivo" (respeta permisos, fechas, dueños).
- `-u`: "Update". **Ojo aquí**. Si el archivo ya existe en tu PC, Rsync mirará la fecha. ¿El del USB es más nuevo? Lo copia. ¿Es más viejo? Lo ignora. Esto evita sobrescribir tu trabajo reciente con una versión antigua.
- `-v` y `-h`: "Cuéntame qué haces (`verbose`) y pónmelo en megas/gigas (`human`), no en bytes".

Una vez termine, puedes expulsar el USB. Tu carpeta `~/Documentos` ahora es la "Versión Maestra" de tu vida digital. Como hemos actualizado. Desde una version "Copia y pega". yo la voy a borrar y asi tengo mi usb disponible para otros menesteres.

## Paso 2: Iniciamos el Repo con BORG
Ahora vamos a preparar el terreno en el disco externo. Esto se hace una sola vez.
```bash
borg init --encryption=repokey /mnt/DiscoExterno/MiBunker
```
```console 
Enter new passphrase: 
Enter same passphrase again: 
Do you want your passphrase to be displayed for verification? [yN]: n
```
> [!WARNING] Seguridad:
> **STOP:** Esta no es la contraseña de tu Netflix. Borg usa encriptación AES-256. Si pierdes esta contraseña, **tus datos son matemáticamente irrecuperables**. Guárdala en tu gestor de contraseñas y ten una copia física en papel.

Veamos esas flags:
- **`borg init`**: Es el equivalente a `git init` o a formatear un disco. Este comando prepara el directorio, crea la estructura de base de datos interna, los índices y los archivos de configuración. Si el directorio no existe, lo crea. Si ya tiene cosas dentro, fallará para protegerte (a menos que el directorio esté vacío).
  
- **`--encryption=repokey` (La decisión crítica)**: Aquí definimos la seguridad criptográfica. Borg ofrece varios modos, pero **repokey** es el estándar para discos externos.
  
- **¿Qué significa?** La llave maestra de encriptación (AES-256) se guarda **DENTRO** del propio repositorio (en el archivo `config`), pero está bloqueada por tu contraseña.
  
- **¿Por qué este y no otro?** Porque hace que el backup sea **autocontenido**. Si te llevas tu disco USB a casa de un amigo o cambias de ordenador, podrás abrir el backup solo con tu contraseña.
  
- **`/mnt/DiscoExterno/MisDocumentos`**: La ruta física donde se guardarán los datos. Borg no guarda un archivo gigante, sino una estructura de carpetas con miles de archivos pequeños ("chunks").

>[!ALERT] Alternativa peligrosa Existe el modo `keyfile` (que guarda la llave en tu PC, no en el disco). Es peligroso para USBs portátiles: si pierdes tu PC, pierdes la llave para abrir el USB. Por eso usamos `repokey`.
## Paso 3: Creando el primer Backup
El repositorio de Borg esta listo. Ahora vamos a empezar a llenarlo con nuestros archivos
```bash
borg create --stats --progress --compression zstd /mnt/DiscoExterno/MiBunker::Documentos-2025-01-01 ~/Documentos/
```
Fíjate que no he puesto una ruta de destino típica, he puesto una sintaxis rara. Borg funciona así: `ruta_al_repo::Nombre_del_Backup`.

Veamos esas flags:
- **`--progress`**: Parece trivial, pero es vital. Sin esto, la terminal se queda congelada y no sabes si el backup está funcionando o se ha colgado. Esta flag activa la barra de estado en tiempo real: verás qué archivo está procesando, la velocidad de transferencia y el porcentaje completado.
  
- `--compression zstd`: Usamos Zstandard. Es el equilibrio perfecto entre velocidad y reducción de tamaño hoy en día.
  
- `--stats`: Al acabar, Borg te dirá la verdad desnuda. Te mostrará el "Tamaño original", el "Tamaño comprimido" y el "Tamaño deduplicado". La primera vez será normal, pero cuando ejecutes este comando mañana... verás que aunque tengas 100GB de documentos, el backup solo añadirá unos pocos MB. **Esa es la magia de la deduplicación**.

- **La sintaxis `::` (Repositorio vs. Archivo)**: Borg distingue entre la "Caja" (El Repositorio) y las "Fotos" que metes dentro (Los Archivos o Snapshots).
 - `/mnt/DiscoExterno/MiBunker`: Es la caja física en el disco.
   
 - `Documentos-2025-01-01`: Es la etiqueta de la foto de hoy. Mañana cambiarás este nombre por `Documentos-2025-01-02`, pero la caja seguirá siendo la misma.
   
 - **`~/Documentos/` (El Origen)**: La carpeta que queremos salvar. Borg es recursivo por defecto: guardará esa carpeta y todo lo que haya dentro de ella, hasta el último subnivel.

> [!SUCCESS] ¡Felicidades!
> Has creado tu primer backup con éxito. Tus archivos ahora están seguros, encriptados y deduplicados dentro de tu búnker digital.

Hasta aqui Todo a ido genial. Hemos terminado de crear nuestro backup. Y ahora todo esta seguro! Pero ahora vamos a hacer unas practicas sobre nuestro backup.

## Recuperando datos (Mount & Restore)
Necesitas recuperar **ese** PDF de hace tres meses. ¿Necesitas descomprimir todo el backup de 500GB? **No.**
Vamos a montar el backup. Y lo haremos en `/tmp`.
## ¿Por qué en /tmp?
El directorio `/tmp` en Linux es un lugar efímero. Generalmente se monta en la memoria RAM o se limpia automáticamente al reiniciar. Es el "banco de trabajo" perfecto. No queremos crear carpetas basura en nuestro sistema principal solo para copiar un archivo. Usamos `/tmp`, sacamos lo que queremos, y lo desmontamos. Y si se nos olvida y seguimos teniendo el usb conectado. Al reiniciar el sistema habra desaparecido.

```bash
# Creamos una carpeta temporal donde montaremos nuestro backup
mkdir /tmp/borg_mount
# Montamos nuestro backup.
borg mount /mnt/DiscoExterno/MiBunker /tmp/borg_mount
# (Te pedirá la contraseña maestra).
```
- **Explora:** Ahora abre tu gestor de archivos y ve a `/tmp/borg_mount`. ¡Sorpresa! Verás carpetas con los nombres de tus backups (ej: `Documentos-2025-01-01`). Puedes entrar, abrir los archivos como si estuvieran en tu disco, ver las fotos, leer los words...
- **Recupera:** Copia el archivo que te falte y pégalo en tu Escritorio.
- **Cierra:** Una vez tengas tu archivo a salvo, desmontamos la ilusión:
```bash
borg umount /tmp/borg_mount
```
Hemos pasado de tener archivos dispersos y duplicados en varios USBs a tener un sistema centralizado, encriptado con seguridad militar y deduplicado para ahorrar espacio.

Y lo mejor de todo: hemos usado herramientas estándar de la industria. Si algún día te toca administrar un servidor Linux en una empresa, sabrás que **Rsync** y **Borg** son tus mejores amigos para dormir tranquilo por las noches.