--- 
title: Forense - Como recupere un disco duro que formate mal.
date: 2025-11-10 11:36 
layout: post 
categories: [Forense] 
---

Estos días tuve un problema. Un problema que, tarde o temprano, nos acaba pasando a todos los que vivimos en la terminal. **Formateé la unidad incorrecta.**
Estaba preparando un USB booteable con varias ISOs para formatear otro equipo. Las prisas y la confianza son malas compañeras: Sencillamente tabular es una mala mania que tengo, no completar casi nunca los comandos o rutas completas. y simplemente delegar en que tabulando se llega a todos los lados. Bueno... Me equivoque y en vez de formatear /dev/sdd formatee /dev/sdb. Similitudes... 

Unos segundos después, me di cuenta del error y un sudor frio recorrio mi frente...
¿Que habia hecho? ¿Que contenia esa particion? lsblk me mostraba un disco de 0Gb (Equisde)... Ahora son risas. Ya esta todo recuperado. Pero os prometo que lo he pasado mal.

Por suerte, lo hice de una forma "incorrecta" (un formateo rápido de sistema de archivos en lugar de un borrado seguro). Así que, paradójicamente, mi error fue mi salvación. He aquí mi pequeño granito de arena para ayudarte si te encuentras en esta situacion.

---
tags: #linux, #recuperación, #sistema, #archlinux, #ext4, #testdisk, #forense 

---
> [!WARNING] CUIDADO! - Arquitectura de Almacenamiento (HDD vs SSD)
> La viabilidad de este procedimiento depende críticamente del medio de almacenamiento subyacente.
>
> * **HDD (Magnético):** La recuperación fue posible debido a la **remanencia de datos**. En medios magnéticos, la eliminación de particiones o el formateo rápido son operaciones a nivel lógico (metadatos) que no alteran los sectores de datos físicos hasta que son sobrescritos explícitamente.
> * **SSD (NAND Flash):** Si el dispositivo afectado hubiera sido un SSD (SATA/NVMe), la recuperación sería improbable debido al comando **TRIM**.
> * **Memorias Flash/USB:** El comportamiento es variable. Dispositivos de gama baja operan similar a un HDD, mientras que unidades modernas con controladores avanzados soportan TRIM/UNMAP, haciendo la recuperación imposible tras unos minutos de inactividad.
>
> ### El impacto del comando TRIM
>
> Es imperativo comprender por qué la recuperación forense de software tiene éxito en medios magnéticos y falla en estado sólido.
>
> **1. Persistencia en HDD (Grabación Magnética)**
> Los discos duros tradicionales operan bajo un esquema de reescritura directa. El controlador del disco no necesita "borrar" un sector magnético antes de escribir nueva información. Por eficiencia de I/O, operaciones como `mkfs` o `fdisk` solo modifican las estructuras de control (MBR, GPT, Superbloques). Los sectores de datos permanecen magnetizados con la información original ("Data Remanence") hasta que una nueva operación de escritura (I/O Write) impacta físicamente en esa dirección LBA específica.
>
> **2. La barrera del SSD (NAND Flash y Garbage Collection)**
> Las memorias NAND Flash tienen una limitación física: no se puede escribir en una celda que ya contiene datos (no soporta sobreescritura directa); la celda debe ser borrada eléctricamente primero.
> Para mitigar la degradación de rendimiento, los sistemas operativos modernos envían el comando **TRIM** (ATA) o **UNMAP** (SCSI) al detectar un borrado de archivos.
> * **El proceso:** El SO informa al controlador del SSD qué páginas lógicas ya no son válidas.
> * **La consecuencia:** El controlador del SSD, a través de su proceso de *Garbage Collection*, purga esos bloques físicamente. Esto resulta en que los datos son reemplazados por ceros a nivel físico, haciendo inútil cualquier intento de recuperación por software.


Por cosas como estas sigo manteniendo discos duros mecanicos en mi sistema...
Hoy en dia todos optan por el rendimiento, por los SDD o los M2. y no los culpo es una buena solucion si lo que quieres es un sistema rapido. Pero si quieres guardar cosas en tu ordenador y las consideras importantes, utiliza un disco duro mecanico.
# Contexto de la situacion:

Mi HDD: /dev/sdb
Mi USB: /dev/sdd 

Hay varias formas de borrar una particion. Yo en este caso queria simplemente crear un usb de arranque para otro equipo. Y me dispuse a hacerlo de una forma rapida. Sin complicarme. (Gracias yo del pasado)
```bash
sudo mkfs.vfat -I -n "ArchLinux" /dev/sdb
```
**¿Qué hace exactamente este comando?** Al usar el flag `-I`, forcé a `mkfs.vfat` a tratar el disco entero (`/dev/sdb`) como si fuera un disquete gigante (Superfloppy), ignorando la tabla de particiones existente.

**Consecuencias Inmediatas:**
1. **Aniquilación de la Tabla de Particiones:** El Master Boot Record (MBR) o la cabecera GPT, que residen en el sector 0 del disco, fueron sobrescritos por la cabecera de arranque de FAT32. El "mapa" del disco desapareció.
2. **Corrupción del Superbloque Primario:** El sistema de archivos `ext4` guarda su información vital (tamaño de bloque, ubicación de inodos, journal) en el **Superbloque**, ubicado tradicionalmente al inicio de la partición. Al escribir la estructura FAT32 encima, este superbloque quedó ilegible.
3. **Inaccesibilidad Total:** Para el sistema operativo, mi disco de 1TB lleno de datos ya no era "HDD1". Ahora aparecía como una unidad vacía llamada "ArchLinux" con formato FAT32.

> [!DANGER] Advertencia Crítica: La Regla de Oro En el momento exacto en que te des cuenta del error, **DETENTE**.
> 1. **No intentes volver a formatear.**
>     
> 2. **No copies archivos nuevos** en el disco (esto sobrescribiría los datos antiguos permanentemente).
>     
> 3. **Desmonta el disco inmediatamente:** `sudo umount /dev/sdb*`.
>     
> 
> Mientras no sobrescribas los sectores magnéticos, los datos siguen ahí. Solo has perdido el índice para encontrarlos.

---

## 1. Diagnóstico y Recuperación (TestDisk) #testdisk 

Con el disco desmontado y en estado de "cuarentena", la prioridad era determinar el alcance del daño a nivel de estructura lógica. 
Para ello, utilizamos **TestDisk**, el estándar *de facto* para la recuperación de tablas de particiones. El objetivo en esta fase no era recuperar archivos individuales todavía, sino restaurar el "contenedor" (la partición) para que el Kernel de Linux pudiera volver a interactuar con el dispositivo de bloques correctamente.
### 1.1. Análisis de Superficie Ejecutamos la herramienta apuntando al dispositivo físico afectado:

> [!INFO] Herramientas utilizadas:
>   testdisk
 ```bash
> sudo pacman -S testdisk
```

```bash
sudo testdisk /dev/sdb
```
El proceso de selección fue estándar:
1. **Select Media:** `/dev/sdb` (1000GB).
2. **Partition Table Type:** `[Intel]` (Al ser un disco antiguo MBR, aunque en discos modernos >2TB sería `[EFI GPT]`).
3. **Operation:** `[Analyse]`.
4. 
Inicialmente, TestDisk reportó lo que el sistema operativo ya sabía: una partición FAT32 corrupta o vacía ocupando todo el espacio. Sin embargo, la magia ocurre al ejecutar **[ Quick Search ]**.
### 1.2. El Hallazgo de la "Partición Fantasma"

El análisis rápido escanea los cilindros buscando cabeceras de sistemas de archivos conocidos. Aquí es donde se confirmó la teoría de la "remanencia de datos". TestDisk encontró dos estructuras superpuestas y contradictorias:

1. **La Capa Superficial (El Error):** Una partición FAT32 etiquetada como "ArchLinux" (el resultado de `mkfs.vfat`).
2. **La Capa Profunda (La Víctima):** Una partición Linux (Ext4) etiquetada como "HDD1".

```shell
Disk /dev/sdb - 1000 GB / 931 GiB - CHS 121601 255 63
     Partition               Start        End    Size in sectors
  FAT32 LBA                0   0  1 121601  80 63 1953525168 [ArchLinux]
> Linux                    0  32 33 121601  57 56 1953521664 [HDD1]
```
> [!TIP] Interpretación:
> La presencia de la etiqueta `[HDD1]` y la coincidencia en el tamaño de sectores confirmaron que la estructura geométrica de la partición original estaba intacta. El formateo rápido solo había sobrescrito los primeros sectores (LBA 0-2048 aprox), dejando el resto de la estructura de partición legible para una herramienta de bajo nivel.

### 1.3. Verificación y Escritura

Antes de proceder, intenté listar el contenido de la partición detectada (`HDD1`)
- **Resultado:** `Can't open filesystem. Filesystem seems damaged.`
- **Diagnóstico:** Esto era esperado. Aunque TestDisk encontró los límites de la partición (dónde empieza y acaba), la "puerta de entrada" (el Superbloque) estaba destruida.
- 
A pesar de no poder ver los archivos, la geometría era correcta. Procedí a escribir la tabla de particiones recuperada en el disco:

1. Seleccionar la partición `Linux [HDD1]` (marcada como `P`).
2. **[ Enter ]** para continuar.
3. Te saldra una nueva opcion [DEEP SEARCH]. Esta es una opcion donde podras comprobar datos. pero no la completes. Tardara bastante tiempo y si hasta el momento has tenido resultados como los que te muestro. Estamos seguros de que podemos recuperar la particion. 
4. **[ Write ]** para confirmar la escritura de la nueva tabla de particiones en el MBR.
5. **Reboot**.

Tras el reinicio, el sistema operativo ya no veía un disco vacío, sino un dispositivo `/dev/sdb` con una partición `/dev/sdb1`. Sin embargo, al intentar montarla, nos enfrentamos al verdadero reto.
## 2. Cirugía de Sistema de Archivos: El Superbloque #mke2fs #fsck

> [!INFO] Recuperación con TestDisk en ext4 vs NTFS
 > El proceso que estamos realizando —buscar superbloques de respaldo, reconstruir el sistema de archivos y recuperar la estructura original— **es válido en ext4**, porque este sistema guarda múltiples copias del superbloque distribuidas por toda la partición.
 > > En **NTFS**, sin embargo, la situación es distinta. NTFS no usa superbloques: su estructura crítica es el **MFT**, y solo posee una copia parcial llamada **$MFTMirr**, que únicamente replica las primeras entradas.   
 > > Esto significa que, si el MFT principal está dañado o pisado por otro formateo, **NTFS no ofrece tantas estructuras redundantes como ext4** para reconstruirlo.   
 > > TestDisk puede recuperar particiones NTFS, reparar el boot sector o reconstruir el MFT a partir de su espejo, **pero si ambos están dañados, la recuperación se vuelve mucho más limitada** que en ext4.


Tras reiniciar, `lsblk` ya mostraba mi partición `/dev/sdb1`. La euforia duró poco. Al intentar montarla, el sistema me devolvió a la realidad con un error crítico:
```bash
sudo mount /dev/sdb1 /mnt/rescate
> mount: wrong fs type, bad option, bad superblock on /dev/sdb1...
````
Me dio por consultar `dmesg` para ver que tenia que decir el kernel sobre esto...
> _"EXT4-fs (sdb1): VFS: Can't find ext4 filesystem"_

### 2.1. Anatomía del Problema
El **Superbloque** es el sector más importante de un sistema de archivos `ext4`. Contiene la configuración vital: tamaño del bloque, número de inodos, estado del journal, etc. Por defecto, vive en los primeros 1024 bytes de la partición. Como mi formateo accidental (`mkfs.vfat`) escribió una cabecera FAT32 precisamente en ese inicio, **el Superbloque Primario fue aniquilado**.

Sin embargo, los ingenieros de ext4 son paranoicos (**gracias**). El sistema guarda **copias de seguridad del superbloque** esparcidas por todo el disco, precisamente para catástrofes como esta.

### 2.2. La Búsqueda superbloque (`mke2fs -n`)
El problema era: ¿Dónde están esas copias? Las ubicaciones dependen del tamaño del bloque y la geometría, que no podíamos leer.

Utilicé un truco de "ingeniería inversa": Simular que formateaba el disco de nuevo con `ext4` para ver dónde pondría el sistema las copias, pero **sin escribir nada realmente**.
```bash
sudo mke2fs -n /dev/sdb1
```
- **El flag `-n` es vital:** Significa "No hacer nada, solo mostrar qué harías".
- **El resultado:** El comando escupió la geometría calculada y, lo más importante, la lista de numeros magicos. Los respaldos:
```shell
mke2fs 1.47.3 (8-Jul-2025)

Superblock backups stored on blocks:
    32768, 98304, 163840, 229376, 294912, 819200...
```
### 2.3. La Reparación Forzada (`fsck`)

Con el mapa en la mano, intenté reparar el sistema usando el primer respaldo (`32768`). Falló. Probablemente el daño del formateo llego hasta ahí.

![[Recuperando 0.png]]

Pasé al siguiente: **Bloque 98304**.
```bash
sudo fsck.ext4 -b 98304 /dev/sdb1
```
Inicialmente lance ese comando. el cual pues te va mostrando informacion y pide confirmacion, aunque tenia pocas esperanzas... Y los resultados que mostraba eran incongluentes... Me dispuse a lanzar un -y (yes to all) ;)
```bash
sudo fsck.ext4 -b 98304 -y /dev/sdb1
```
Cruce los dedos, cerre el culo con fuerza...

![[Recuperando.png]]

El proceso fue tenso. `fsck` detectó que el **Journal** (diario de transacciones) y el **Inodo Raíz** (la carpeta `/`) eran inválidos.

> _Superblock has an invalid journal. Clear? yes_ _Root inode is not a directory. Clear? yes_

Al terminar, la terminal mostró el mensaje más hermoso que he leído en años:
`***** FILE SYSTEM WAS MODIFIED *****`

![[Recuperado.png]]

El sistema de archivos era consistente de nuevo. Pero había un precio a pagar: al recrear el inodo raíz, habíamos perdido la estructura de carpetas.


## 3. Recuperando mis archivos. #mount
> [!INFO] Montaje
> Como aun no estaba seguro de lo que estaba ocurriendo, decidi montar manualmente el disco. Para poder controlar realmente que estaba ocurriendo y trastear desde la terminal antes de romper mas nada.

Con el sistema de archivos reparado, monté la unidad esperando ver mis carpetas de siempre...
```bash
 sudo mount /dev/sdb1 /mnt/rescate ls -l /mnt/rescate
 ```
**El disco estaba vacío**. Solo había una carpeta del sistema: `lost+found`

### 3.1. ¿Dónde están mis archivos?

Aquí es donde entra la teoría del sistema de archivos. En Linux, un nombre de archivo (ej: "foto.jpg") es solo una etiqueta humana que apunta a un número de **Inodo** (donde están los datos reales). Como `fsck` tuvo que recrear el **Inodo Raíz** (la carpeta principal `/`), el "index de archivos" que asociaba nombres con inodos se perdió.

Sin embargo, los inodos de mis datos seguían intactos. `fsck` los encontró "huérfanos" (sin padre) y, para salvarlos, los movió a la carpeta de objetos perdidos: `/lost+found`.

### 3.2. Recuperando la Identidad

El acceso a `lost+found` está restringido estrictamente a `root`. Tuve que elevar privilegios para mirar dentro:

```bash
sudo -s # Entrar en modo root 
cd /mnt/rescate/lost+found 
find . -maxdepth 3
```
![[Recuperacion completa 1.png]]

 Esto fue una excelente noticia. Significaba que la estructura de carpetas _interna_ se había conservado. Solo se había perdido la puerta de entrada. y se encontraban en 3 carpetas unicas. 

- `'#18350081'/`
- `'#43253761'/`
- `'#57409537'/`

Procedi a sacar los archivos de lost+found:
```bash
mv /mnt/rescate/lost+found/'#18350081' /mnt/rescate/Principal
mv /mnt/rescate/lost+found/'#57409537' /mnt/rescate/Segundo
mv /mnt/rescate/lost+found/'#43253761' /mnt/rescate/Tercero
```
Y WALA! Mis archivos estaban ahi dentro bien organizados. Uno de los directorios que habia salvado eran archivos multimedia. a si que me dispuse a hacer lo que tenia que hacer, Por que esto ocurrio amigos a 3 de la mañana tras desvelarme y decidir que era buena idea ponerme a hacer cosas que... Obviamente no eran buena idea. A si que abri mi carpeta multimedia y me puse a ver mi serie favorita. 

Un saludo.
> [!SUCCESS] Resumen de Herramientas
-**TestDisk:** Recuperó la geometría de la partición (Start/End).
 **mke2fs -n:** Localizó los superbloques de respaldo ocultos.
 **fsck:** Reconstruyó el árbol de directorios usando un respaldo.
 
