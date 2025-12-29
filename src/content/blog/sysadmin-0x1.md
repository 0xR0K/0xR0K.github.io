---
title: La Biblia del SysAdmin - Cómo saber si te han hackeado hasta el alma.
date: 2025-12-15 17:52 
categories: [SysAdmin, Forense] 
---

A ver, merluzo, deja de mirar TikTok un rato. Hoy vamos a hablar de algo serio.

Si administras servidores, ya sabes que la tranquilidad es solo un estado temporal antes del siguiente desastre. Y si usas **Arch Linux** en producción (valiente, me gusta tu estilo) o simplemente quieres entender qué demonios pasa en tu estación de trabajo, tienes que asumir una realidad: **si no miras los logs, eres ciego.**

Mucha gente se instala Linux (cualquier distro) y se cree que es Neo en Matrix. Piensan que son invulnerables. **Mentira cochina.** Si no sabes mirar debajo del capó, tu sistema puede estar minando criptomonedas para un ruso desde hace tres meses y tú, feliz de la vida, pensando que el ventilador suena fuerte porque hace calor.

Hoy vamos a dejarnos de tonterías y vamos a aprender a auditar un sistema de verdad. Nada de "instalar un antivirus". Vamos a ensuciarnos las manos con logs, sockets, el kernel y un poco de Python. Si te da miedo la terminal, cierra esto y vuelve a Windows.

> [!NOTE] Este articulo esta creado para SysAdmins. 
> Pero desde ArchLinux Este artículo se centra en la arquitectura de Arch Linux, que es "systemd-heavy". Si usas Alpine, Void o Gentoo con OpenRC, la mitad de estos comandos (journalctl) no te servirán, aunque la lógica de red (ss, lsof) es universal.

---
## 1. Arquitectura de Logs en Systemd: Volatilidad vs. Persistencia
Para entender qué pasa en tu sistema, primero tienes que saber dónde se guarda la información. Arch Linux depende estrictamente de **systemd**. A diferencia de los sistemas antiguos que tiraban todo en archivos de texto plano desordenados (cuando los sysadmins tenían barba de verdad y no de hipster), `systemd` usa un componente llamado `systemd-journald`.

Este demonio captura todo: kernel, arranque, servicios y errores. Pero aquí viene el problema que pilla desprevenidos a muchos: **la configuración por defecto.**

### El problema de `/run/` (O por qué tus logs desaparecen)
En muchas instalaciones base, o si `systemd` no encuentra la carpeta correcta, los logs se guardan en `/run/log/journal/`.

- **¿Qué es `/run`?** Es un sistema de archivos temporal en memoria RAM (tmpfs).
- **¿Qué implica esto?** Que si tu servidor se reinicia (o te lo reinician tras un ataque), **los logs se borran**. Adiós evidencia forense.

### La Solución: Forzar la persistencia en disco
Necesitamos que los logs se guarden en `/var/log/journal/`, donde sobreviven a los reinicios. Systemd tiene una lógica simple: si la configuración dice `Storage=auto` (que es lo normal), solo guardará en disco **si la carpeta `/var/log/journal` ya existe**. Si no existe, se va a la RAM.
**Vamos a asegurarnos de que esto no pase.**

1. **Crea el directorio manualmente:** Aseguramos el tiro creando la carpeta y asignando los permisos correctos con `tmpfiles`.
```bash
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
```
2. **Configura el demonio:** Edita `/etc/systemd/journald.conf` (o mejor, crea un archivo `.conf` en `/etc/systemd/journald.conf.d/` para no tocar el original). Busca o añade:
```bash
[Journal]
Storage=persistent
```
3. Reinicia el servicio:
```bash
sudo systemctl restart systemd-journald
```
1. Ahora sí, tus logs son inmortales (hasta que se llene el disco, o los borres tú o el atacante).
> [!NOTE] Aclaracion
> Puedo leer los logs con un `cat` o un editor de texto? **Depende.** Arch Linux, en su instalación base, centraliza casi todo en el **Journal**, que es una base de datos binaria e indexada. Por eso, si intentas hacer un `cat` a un archivo del journal, solo verás basura ininteligible. Sin embargo, aplicaciones específicas (como el gestor de paquetes `pacman` o servidores web como `nginx`) siguen generando logs de texto plano tradicionales en `/var/log/`.

## 2. Dominando `journalctl`: Consultas y Filtrado
Como los logs de systemd son binarios (indexados para velocidad), no puedes usar `cat` o `less` a pelo. Necesitas el intérprete: `journalctl`.

Olvídate de hacer scroll infinito. Aquí tienes los comandos para filtrar el ruido y encontrar la chicha.

### Comandos esenciales de filtrado
- **Ver todo lo que ha pasado desde que encendiste el PC:** `journalctl -b`.
- **Ver lo que pasó en el arranque ANTERIOR (Forenses post-crash):** `journalctl -b -1` (El -1 es "hace un arranque", -2 hace dos... pillas la idea, ¿no?).
- **Ver lo que está pasando AHORA MISMO (Live):** `journalctl -f`. _Esto es como ver Matrix en tiempo real._
- **Filtrar por Unidad (Service Unit):** Si sospechas del servidor SSH (el vector de ataque más común), no mires los logs de la impresora. `journalctl -u sshd`. Esto aísla exclusivamente los logs del demonio SSH.

> [!WARNING] Aclaracion: 
> Si ves miles de líneas en rojo intentando entrar por SSH, felicidades, has descubierto Internet. Si ves un "Accepted password", y no has sido tú, o no conoces la procedencia, es posible que una familia de Kazajistán esté conectada a tu máquina.

### Exportación para análisis (JSON)
Si eres de los que les gusta programar sus propias herramientas. `journalctl` puede escupir los datos en JSON. `journalctl -u sshd -o json-pretty`. Esto es vital porque nos permite procesar fechas, IPs y procesos de forma programática sin pelear con expresiones regulares imposibles.

---

## 3. Auditoría Total de Conexiones: Usuarios y Red
Aquí unificamos lo que separa a los niños de los adultos. Un malware puede borrar sus logs, pero difícilmente puede ocultar una conexión de red activa si sabemos cómo mirar (a menos que sea un rootkit de kernel muy sofisticado, luego vamos a eso).
Vamos a dividir esto en dos: **Humanos** (quién entra) y **Máquinas** (qué sale).

### A. Los Humanos (Inicios de Sesión)
Arch Linux mantiene archivos "legacy" que son la biblia de la autenticación.
1. **¿Quién ha entrado con éxito?** Usa el comando `last`. Lee el archivo `/var/log/wtmp`. Si ves una IP de Uzbekistán y tú vives en Albacete, tenemos un problema.
2. **¿Quién ha intentado entrar y ha fallado (Fuerza Bruta)?** Usa `sudo lastb`. Lee `/var/log/btmp`. Este archivo suele estar petado. Si ocupa gigas, es que te están aplicando la ley rumana.
3. **¿Quién está conectado AHORA?** El comando más corto del mundo: `w`. Te dice qué usuario está, desde qué IP y qué está haciendo.

### B. El Chivato del Kernel (Conexiones de Red)
Olvida `netstat`. Está obsoleto. La herramienta de un SysAdmin moderno es `ss` (Socket Statistics). Consulta directamente al kernel y es mucho más rápida.
**El comando para ver la verdad:**
```bash
sudo ss -tulpn
```
Analicemos los flags para entender qué vemos:
- **-t / -u**: TCP y UDP.
- **-l**: Listening (puertos a la escucha).
- **-p**: Process (muestra **qué** programa abrió el puerto).
- **-n**: Numeric (IPs reales, sin resolución DNS que tarda una vida).

#### Red Flags: Qué buscar
1. **Conexiones Salientes Sospechosas (ESTABLISHED):** Un servidor web debería _escuchar_, no _iniciar_ conexiones hacia una IP residencial en otro continente para recibir órdenes.
```bash
ss -tnp | grep -v 127.0.0.1 | grep ESTAB
```
Busca procesos como `bash`, `python`, `nc`, o nombres extraños (`kworkerX` falsos) iniciando conexiones hacia fuera.
2. **Sockets Fantasma:** Si ves un puerto abierto pero en la columna del proceso aparece `users:(())` (vacío), cuidado. Puede ser un socket que quedó colgado tras un crash, o un rootkit ocultando su PID.
```bash
sudo ss -lntp | grep -E "users:\(\)"
```
3. **Sockets RAW (Caza Mayor):** Los sockets RAW permiten a un programa manipular paquetes a bajo nivel (usado por `nmap` o sniffers). Si ves `rawtcp` o `rawudp` abierto por un proceso que no controlas, tienes un problema muy serio.
```bash
ss -wpan
```
---

## 4. El Firewall: Nftables y el silencio
Arch Linux utiliza `nftables` como sucesor de `iptables`. Por defecto, si el firewall bloquea un paquete (DROP), lo hace en silencio. Como auditores, necesitamos que el firewall "cante" antes de disparar.

Debemos añadir una regla de **log** en `/etc/nftables.conf` justo antes de la directiva de `drop` o `reject`.
```bash
limit rate 5/minute log prefix "NFT-DROP: " flags all
```
Una vez aplicado, los intentos de escaneo de puertos o conexiones no autorizadas aparecerán en el journal del kernel (`journalctl -k`), permitiéndonos identificar patrones de ataque o IPs maliciosas.

---

## 5. Forense Avanzado: Cazando Rootkits y Fantasmas
Si te enfrentas a un atacante competente, este intentará ocultar sus huellas. Un **Rootkit** puede modificar los binarios del sistema (`ls`, `ps`, `top`) para que sus procesos maliciosos no aparezcan en la lista.

### La técnica de la discrepancia (ps vs lsof)
Si el comando `ps` está trucado, ¿cómo sabemos la verdad? **Comparando**. Un proceso puede ocultarse de `ps`, pero difícilmente puede ocultar sus archivos abiertos o conexiones de red si consultamos al sistema de otra forma.

Este comando compara los PIDs (identificadores de proceso) que ve `ps` contra los que ve `lsof` (list open files):
```bash
diff <(ps aux | awk '{print $1,$11}' | sort -u) <(lsof -i | awk '{print $1,$9}' | sort -u)
```
Si este comando devuelve líneas que aparecen en `lsof` pero no en `ps`, estás ante un proceso oculto.

> [!CAUTION] PROTOCOLO DE EMERGENCIA 
> Si detectas una discrepancia aquí, **NO sigas investigando con la red conectada.** Tira del cable Ethernet o apaga la Wi-Fi inmediatamente. Si el atacante ve que le estás investigando, puede borrarlo todo o cifrar tu disco. Después, la recomendación profesional es **backup de datos críticos y reinstalación limpia**. Nunca te fíes de un sistema comprometido a nivel de root.

> [!NOTE] Explicacion técnica 
> `ps` lee de `/proc`, mientras que `lsof` interroga al sistema de archivos y sockets. Si un binario está trojanizado (modificado por el atacante), mentirá en el primer comando, pero la discrepancia con el segundo cantará.

### Herramientas automáticas y Kernel
No te hagas el héroe si no hace falta. Usa herramientas diseñadas para esto:
1. **rkhunter (Rootkit Hunter):**
```bash
sudo pacman -S rkhunter 
sudo rkhunter --update 
sudo rkhunter --check --sk
```
2. **chkrootkit:** Otro clásico. `sudo chkrootkit`.

**Módulos del Kernel:** Si el rootkit está a nivel de kernel (`.ko`), estás jodido. Pero puedes mirar qué tienes cargado:
```bash
lsmod
```
Si ves un módulo con nombre raro (ej: `h4x0r`, `flipper`, o nombres aleatorios) que no tiene descripción con `modinfo`, sospecha.

---

## 6. Auditd: Vigilancia de Integridad
Si quieres subir el nivel y saber no solo "quién entra" sino "qué tocan", necesitas el **Audit Framework**. Esto permite vigilar cambios en archivos críticos (`/etc/passwd`, `/etc/shadow`, `/etc/hosts`).
1. Instalar: `sudo pacman -S audit`.
2. Activar: `sudo systemctl enable --now auditd`.
3. Añade `audit=1` en tu GRUB para que arranque desde el segundo cero.
4. Configura reglas en `/etc/audit/rules.d/audit.rules`:
```bash
-w /etc/passwd -p wa -k identidad_modificada 
-w /etc/shadow -p wa -k identidad_modificada 
-w /etc/resolv.conf -p wa -k red_modificada
```
Luego, si sospechas algo, preguntas al auditor: `ausearch -k identidad_modificada`. Te dirá exactamente quién tocó ese archivo y cuándo.

---

## 7. Limpieza (Cuando todo ha terminado)
Supongamos que has revisado todo y estás limpio. Los logs ocupan espacio. Y en Arch, si no los controlas, se comen el disco duro.

**Vaciar el journal:** No borres los archivos a mano con `rm` a menos que seas un bárbaro. Usa la herramienta adecuada:
```bash
sudo journalctl --vacuum-time=1s
```
> [!WARNING] ADVERTENCIA FINAL
> Si has sido hackeado, **NO BORRES LOGS**. Copia `/var/log` entero a un USB externo y precíntalo. Eso es evidencia forense. Si borras los logs, borras las huellas del crimen y ayudas al atacante.

### Conclusión

La seguridad en Linux es un animal diferente al de Windows, y hay que entenderlo.

En Windows, el sistema de seguridad se basa en que el usuario promedio va a cometer errores, por lo que existen suites de antivirus masivas que intentan bloquearlo todo. Los ataques allí suelen ser de "pesca de arrastre": correos masivos, ejecutables falsos, esperando que alguien pique.

En Linux, la película cambia. Los vectores de ataque suelen ser dirigidos: bots automatizados escaneando internet 24/7 buscando versiones de software vulnerables, configuraciones SSH débiles o servicios mal configurados. Aquí no te salva un antivirus mágico; **te salvas tú**.

La seguridad de tu sistema depende de tu capacidad. Si conoces tu sistema, si sabes qué procesos deben correr y qué puertos deben estar abiertos, detectarás la anomalía antes de que sea crítica. **Tú eres el antivirus**.
