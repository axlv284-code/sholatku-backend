/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.2.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: sholatku_db
-- ------------------------------------------------------
-- Server version	12.2.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `presensi`
--

DROP TABLE IF EXISTS `presensi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `presensi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `jenis_sholat` varchar(50) DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `waktu` time DEFAULT NULL,
  `lokasi` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `presensi`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `presensi` WRITE;
/*!40000 ALTER TABLE `presensi` DISABLE KEYS */;
INSERT INTO `presensi` VALUES
(1,1,'Dzuhur','2026-05-10','20:54:41','-7.1234, 110.5678'),
(2,1,'Dzuhur','2026-05-11','06:59:55','-6.9669883, 110.4023833'),
(3,1,'Dzuhur','2026-05-12','07:13:26','-6.966806, 110.4024173'),
(4,1,'Dzuhur','2026-05-12','07:17:34','-6.9668098, 110.4024091'),
(5,1,'Ashar','2026-05-12','08:06:09','-6.966809, 110.4024158'),
(6,1,'Ashar','2026-05-12','08:10:27','-6.9667837, 110.4024253'),
(7,1,'Dzuhur','2026-05-12','08:10:43','-6.9667881, 110.4024331'),
(8,1,'Dzuhur','2026-05-12','08:11:17','-6.9667991, 110.4024348'),
(9,1,'Dzuhur','2026-05-12','08:13:43','-6.9668087, 110.4024082'),
(10,1,'Dzuhur','2026-05-12','08:27:58','-6.9667833, 110.402421'),
(11,1,'Dzuhur','2026-05-12','08:39:34','-6.9667876, 110.4024026'),
(12,1,'Dzuhur','2026-05-12','08:39:34','-6.9667876, 110.4024026'),
(13,1,'Dzuhur','2026-05-12','08:39:34','-6.9667876, 110.4024026'),
(14,1,'Dzuhur','2026-05-12','08:39:59','-6.9667918, 110.4024503'),
(15,1,'Dzuhur','2026-05-12','08:56:02','-6.9667878, 110.402445'),
(16,1,'Dzuhur','2026-05-12','08:56:27','-6.9667967, 110.4024488'),
(17,1,'Dzuhur','2026-05-12','08:56:56','-6.9667749, 110.4024585'),
(18,1,'Dzuhur','2026-05-12','09:10:03','-6.9668083, 110.4023946');
/*!40000 ALTER TABLE `presensi` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `nisn` varchar(20) DEFAULT NULL,
  `kelas` varchar(50) DEFAULT NULL,
  `otp_code` varchar(6) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'Axl Test','axl@test.com','$2b$10$ocg40p6DhNA31OyTCg.sv.Abq693kIDz5yiauo0z9c67LMlnRamti','24362','11 RPL',NULL,0),
(2,'Axl','axlv284@gmail.com','$2b$10$9bO.S/vFRtvn4elNdlqJxO5.BYfSjMBvIHMrdQVzhRvwjhwIFVnle','24362','XI RPL 2',NULL,1),
(3,'Arya','dimasaryaalamsyah@gmail.com','$2b$10$jEDJhrJosgF4G3u/y1fr8ODHNAj2Ak0PcnONI4T9uq4Pav0aQyU/2','23232','XI RPL 2',NULL,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-05-12 18:48:37
