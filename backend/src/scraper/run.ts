import { scrapeGratis } from './stores/gratis';
import { scrapeWatsons } from './stores/watsons';
import { scrapeRossmann } from './stores/rossmann';
import { db } from '../db';

export async function runAllScrapers(): Promise<void> {
  console.log('--- Kazıma Çevrimi Başlatıldı ---', new Date().toISOString());
  
  try {
    // Run sequentially to prevent high CPU / VDS load
    await scrapeGratis();
    console.log('------------------------------');
    await scrapeWatsons();
    console.log('------------------------------');
    await scrapeRossmann();
    console.log('------------------------------');
    console.log('Tüm mağaza kazıma işlemleri başarıyla tamamlandı.');
  } catch (error) {
    console.error('Kazıma işlemi sırasında genel bir hata oluştu:', error);
  }
}

// If executed directly from command line (e.g. npm run scrape)
if ((require as any).main === module) {
  runAllScrapers().then(() => {
    console.log('Veritabanı bağlantısı sonlandırılıyor...');
    db.pool.end();
    process.exit(0);
  }).catch((err: any) => {
    console.error('Kritik Hata:', err);
    db.pool.end();
    process.exit(1);
  });
}
