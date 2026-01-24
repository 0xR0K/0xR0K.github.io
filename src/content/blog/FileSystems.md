---
title: FileSystems
date: 2025-12-28
categories:
  - Arquitectura de Sistemas
---
Hoy inauguramos la categoría **Arquitectura de Sistemas** hablando de una de las piezas angulares de cualquier SO: los **Sistemas de Archivos** (FileSystems o FS).

Este tema merece un artículo propio porque es la base sobre la que descansan tus datos. La gran ventaja de Linux es que **nosotros somos los arquitectos del sistema**. Es cierto que existen muchas distribuciones con instaladores visuales y automatizados que nos facilitan la vida con configuraciones "básicas" (el famoso _Siguiente > Siguiente > Instalar_). Esto es cómodo, pero nos abstrae de lo que realmente está ocurriendo bajo el capó. Y es por eso que para mí esta parte es crucial:

> _"Un gran poder, conlleva una gran responsabilidad"_

Tener el poder de configurar tu sistema al milímetro no significa que siempre tengas la necesidad de hacerlo, pero **saber y poder** son una gran herramienta.

Es por esto que vamos a estar explicando los sistemas de archivos: cuáles existen, su utilidad real y por qué son mejores opciones según qué necesidades tengamos. No es lo mismo un usuario estándar que usa `ext4` por inercia, que alguien que elige `btrfs` por sus snapshots, o alguien que monta un servidor multimedia y necesita un sistema específico para grandes volúmenes de datos.

Esto es importante si quieres trabajar con Linux de verdad, ya sea para optimizar tu ordenador personal al 100% o para administrar servidores donde el rendimiento es crítico.
# ¿Qué es un FileSystem?
![[Que es un FileSystem.png]]
Para entender la arquitectura, primero necesitamos aclarar dónde pisamos. Asumo que ya tienes nociones básicas de Linux, pero vamos a repasar el contexto físico y lógico para que nadie se pierda.

## 1. El Contexto Físico: Tus discos en `/dev/`
En Linux, **todo es un archivo**, incluido el hardware. Tu disco duro físico (ese trozo de metal o chip soldado) está representado por un archivo en el directorio `/dev/` (Devices).

No todos los discos se llaman igual. Dependiendo de la tecnología de conexión que usen, el sistema les asignará una nomenclatura distinta. Es vital que reconozcas estas "matrículas" para no formatear el disco equivocado:
> [!INFO] Nomenclaturas de Dispositivos de Bloque
> - **`sdX` (SATA/SCSI/USB):** Es lo más común (Standard Disk). `sda` es el primer disco, `sdb` el segundo, etc. Aquí entran los SSD SATA, los HDD mecánicos y los pendrives USB.
> - **`nvmeXnY` (NVMe):** Para los discos SSD modernos conectados por PCI Express. Ejemplo: `nvme0n1`. Son mucho más rápidos y su nombre lo refleja.
> - **`vdX` (Virtual Disk):** Si estás en un VPS o una Máquina Virtual (KVM/QEMU), verás esto. Son discos "falsos" presentados por el hipervisor.
> - **`mmcblkX` (Tarjetas SD/eMMC):** Común en portátiles baratos o placas como Raspberry Pi.
## 2. El Concepto Lógico: El FileSystem
Ahora bien, tener un disco en `/dev/sda` no sirve de nada por sí solo. Un disco duro "crudo" (raw) es simplemente un almacén gigante de celdas vacías (ceros y unos) sin orden ni concierto. Si escribieras datos ahí directamente, sería como tirar hojas de papel en una habitación vacía: están ahí, pero buena suerte encontrando la página 3 del informe de ayer.

Aquí es donde entra el **FileSystem**.

El Sistema de Archivos **no es un formato físico**, es una estructura lógica. Es el software (o protocolo) que le dice al sistema operativo **cómo** debe almacenar, nombrar, organizar y recuperar los datos dentro de esa partición.
Piénsalo como el **índice de un libro** que te indica en qué página se encuentra cada contenido:
- **Mapeo:** El FS crea un mapa (índice) de dónde está cada trozo de información en el disco. Sin este índice, el sistema operativo solo vería ruido binario.
- **Metadatos:** No solo guarda el contenido del archivo, sino _quién_ es el dueño (permisos), _cuándo_ se creó (timestamps) y _qué_ tipo de archivo es.
- **Integridad:** Define cómo se recuperan los datos si se va la luz mientras escribías (Journaling).
    
En resumen: **El FileSystem es la capa que transforma un bloque de silicio inerte en una estructura de carpetas y archivos navegable.** Y dependiendo de _cómo_ haga ese trabajo, tu ordenador será más rápido, más seguro o más eficiente.

## ¿Cuáles son los Sistemas de Archivos más utilizados?
Aquí entramos en materia. La elección del formato define la velocidad, la fiabilidad y las capacidades de recuperación de tu máquina. No hay un "mejor" absoluto, pero sí una herramienta adecuada para cada trabajo. Vamos a analizar las opciones más comunes hoy en día, entendiendo su arquitectura y su caso de uso ideal.
### NTFS
Es el sistema de archivos nativo de Windows. En el ecosistema Linux es un ciudadano de segunda clase: no es nativo, su rendimiento a través del driver `ntfs-3g` consume CPU innecesariamente y tiende a fragmentarse con el tiempo. Su única utilidad real en nuestro entorno es servir de puente. Si tienes un sistema con **dual-boot** (Windows y Linux en la misma máquina), puedes usar una partición NTFS para compartir archivos entre ambos sistemas. Fuera de ese caso de uso, no tiene cabida en una instalación de Linux.
### VFAT (FAT32) y exFAT
Estos son los estándares de compatibilidad de Microsoft. Su característica principal es que son extremadamente simples y universales, pero carecen de seguridad (no guardan permisos de usuario, ni propietarios, ni atributos avanzados de Linux). Esta limitación genera una dualidad curiosa:
- **Para el Sistema Operativo (NO):** Nunca puedes instalar Linux dentro de una partición FAT32/exFAT. El sistema fallaría inmediatamente al no poder asignar permisos a los archivos críticos.
    
- **Para el Arranque (SÍ):** Sin embargo, la partición `/boot/efi` **debe** ser FAT32. ¿Por qué? Porque la BIOS/UEFI de tu placa base es un software muy rudimentario que no entiende de `ext4` o `btrfs`. Solo sabe leer FAT32 para buscar el archivo de arranque inicial.
    

**Resumen:** Usa FAT32 exclusivamente para la pequeña partición de arranque (EFI) y `exFAT` para pendrives USB que necesites compartir entre Windows, Mac y Linux.
### F2FS
El _Flash-Friendly File System_ fue diseñado por Samsung específicamente para memorias basadas en tecnología Flash (SSD, Tarjetas SD, eMMC, NVMe). A diferencia de los sistemas tradicionales que tratan el disco como un plato magnético giratorio, F2FS entiende la geometría interna de las celdas de memoria. Gestiona el desgaste (_wear leveling_) de forma nativa, lo que lo convierte en una opción técnicamente superior para la partición raíz `/` en portátiles modernos o, imperativamente, para alargar la vida útil de la tarjeta SD en una Raspberry Pi.
### ext4
Es el estándar de oro y la opción por defecto en la inmensa mayoría de distribuciones (Debian, Ubuntu, Mint...). Como evolución directa de `ext3`, su filosofía es la estabilidad absoluta. Cuenta con un sistema de _Journaling_ robusto que protege la integridad de los datos ante cortes de energía. Es rápido, está extremadamente probado y rara vez falla. Es la definición de "instalar y olvidar": si buscas un sistema que simplemente funcione sin complicaciones ni mantenimientos, este es el camino.
### XFS
El favorito en el entorno empresarial (RHEL, CentOS, Rocky). Es una bestia diseñada para el rendimiento puro manejando archivos gigantescos y operaciones de escritura en paralelo, escenarios donde `ext4` empieza a sufrir. Es la opción predilecta para servidores de bases de datos pesadas o estaciones de edición de vídeo en alta resolución. Su única limitación histórica es que permite aumentar el tamaño de la partición en caliente, pero no reducirlo (_shrink_), lo que exige planificar bien el espacio.
### Btrfs
El presente de muchas distribuciones modernas como Fedora o OpenSUSE. Su arquitectura se basa en **Copy-on-Write (CoW)**, lo que le otorga capacidades que un sistema tradicional no puede ofrecer. Su característica estrella son los **Snapshots** (instantáneas): permiten congelar el estado del sistema antes de una operación crítica (como una actualización grande). Si algo se rompe, puedes revertir el sistema al estado anterior en segundos. Además, integra gestión de volúmenes y RAID de forma nativa, simplificando lo que antes requería herramientas como LVM.
### ZFS
Originario de Solaris, es considerado por muchos el "dios" de los sistemas de archivos por su obsesión matemática con la integridad de los datos. Ofrece funcionalidades similares a Btrfs (CoW, Snapshots, RAID) pero con una robustez legendaria. El problema en Linux es su licencia (CDDL), que no es compatible con la licencia del Kernel (GPL). Esto obliga a usar módulos externos (DKMS) y complica ligeramente su mantenimiento. No es para un escritorio estándar, pero es la opción reina para montar un servidor de almacenamiento (NAS) donde los datos son críticos.
### Bcachefs
La nueva promesa que acaba de aterrizar oficialmente en el Kernel. Nace con la ambición de unir la velocidad cruda de los sistemas clásicos (`ext4`/`XFS`) con las funcionalidades avanzadas (`CoW`/`Snapshots`) de `Btrfs` y `ZFS`. Aunque promete ser el sistema definitivo, todavía se considera "verde" para entornos de producción crítica. Es una opción excelente para experimentar y probar el futuro de la arquitectura en Linux, pero debe usarse con precaución hasta que madure.

# Memorias de Intercambio (Swap y ZRAM)
Aunque técnicamente no son sistemas de archivos donde guardas documentos, son espacios críticos en la arquitectura de almacenamiento de Linux. Cuando la RAM física se llena, el sistema necesita un lugar donde "aparcar" temporalmente los datos menos usados para que el ordenador no se congele.

Aquí tenemos tres arquitecturas distintas para solucionar el mismo problema:
### 1. Swap Partition (Método Tradicional)
Es el método clásico. Al instalar Linux, separas un trozo físico del disco duro (por ejemplo, 8GB) exclusivamente para usarlo como memoria de intercambio.
- **Funcionamiento:** El kernel accede directamente a este espacio en disco (bloques raw).
- **Ventaja:** Es robusto y permite la hibernación (guardar todo el contenido de la RAM al disco y apagar el PC).
- **Desventaja:** Es rígido. Si asignaste 8GB y un día necesitas 16GB, te toca modificar las particiones del disco.
### 2. Swapfile (Método Moderno)
En lugar de una partición dedicada, se crea un archivo dentro de tu sistema de archivos normal (por ejemplo, `/swapfile`).
- **Funcionamiento:** A nivel de rendimiento es casi idéntico a la partición. Sigue siendo escritura en disco, pero en vez de escribir en bloques reservados, escribe en un archivo gestionado por el FileSystem (`ext4`, `btrfs`, etc.).
- **Ventaja:** La flexibilidad absoluta. Si necesitas más swap, simplemente borras el archivo y creas uno más grande con un comando, sin tocar particiones ni arriesgar el sistema.
- **Desventaja:** Requiere una configuración extra mínima en sistemas CoW como Btrfs (desactivar el copy-on-write para ese archivo específico).
### 3. ZRAM (Compresión en RAM)
Esta es la arquitectura de optimización. ZRAM no toca el disco duro; crea un bloque de dispositivo virtual **dentro de la propia RAM**, pero comprimido.
- **Funcionamiento:** Si tienes 16GB de RAM, ZRAM reserva una parte y comprime los datos en tiempo real (usando algoritmos como `zstd` o `lz4`). Lo que ocuparía 1GB en swap normal, en ZRAM puede ocupar solo 300MB.
- **Ventaja:** La CPU descomprimiendo datos es mil veces más rápida que el disco duro leyendo datos. El sistema se siente mucho más fluido bajo carga y evitas desgaste en tu SSD.
- **Desventaja:** Si se va la luz o reinicias, los datos se pierden (es volátil), por lo que por sí solo no permite hibernar.
    
> [!TIP] Estrategia Híbrida (Lo mejor de ambos mundos) 
 Linux permite usar **ambos sistemas simultáneamente** mediante un sistema de prioridades.
> Puedes configurar ZRAM con alta prioridad y un Swapfile (o partición) con baja prioridad. El sistema llenará primero la ZRAM (rápido y eficiente) y, solo si esta se desborda, empezará a usar el disco duro como último recurso para evitar colapsar. 
> Además, al contar con un respaldo físico en disco (Swapfile/Partición), mantienes la capacidad de **hibernar el sistema** si lo necesitas, algo que perderías usando únicamente ZRAM.

# Conclusión: La Arquitectura es Decisión
Al final, en Linux tenemos el poder de construir nuestro propio sistema. Podemos optar por una arquitectura prefabricada, generalmente pensada para el usuario promedio, pero nosotros queremos ser **Administradores**. Queremos comprender nuestro sistema, entenderlo y exprimirlo.

Comprender las herramientas que nos rodean nos hace poderosos. No tenemos la obligación de tocar todo y cambiarlo por obligación, pero tenemos que saber que hay mejores opciones.

Hoy hemos aprendido que podemos tener un sistema con distintos FS y los puntos fuertes de cada uno. A mí, por ejemplo, me gusta usar `btrfs` para mi partición `/` y `ext4` para mi partición `/home`. Porque es lo mejor para mí: poder controlar qué ocurre y cómo ocurre, tener el control absoluto de mi sistema.

¡Ahora eres tú quien tiene que construir su sistema con las herramientas que conoces!
