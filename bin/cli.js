201~200~#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const os = require('os');

const rl = readline.createInterface({
	  input: process.stdin,
	    output: process.stdout
	    });

	    // Penentuan folder Tools berdasarkan OS (menyimpan di folder Home agar aman)
	    const TOOLS_DIR = path.join(os.homedir(), '.media-dl');
	    const isWindows = process.platform === 'win32';

	    const YTDLP_PATH = path.join(TOOLS_DIR, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
	    const FFMPEG_PATH = path.join(TOOLS_DIR, isWindows ? 'ffmpeg.exe' : 'ffmpeg');

	    if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });

	    function askQuestion(query) {
	    	  return new Promise(resolve => rl.question(query, resolve));
	    	  }

	    	  function checkTools() {
	    	  	  return {
	    	  	  	    ytExists: fs.existsSync(YTDLP_PATH),
	    	  	  	        ffExists: fs.existsSync(FFMPEG_PATH)
	    	  	  	          };
	    	  	  	          }

	    	  	  	          async function installTools() {
	    	  	  	          	  console.log(`\n--- 🛠️ INSTALASI TOOLS (${process.platform.toUpperCase()}) ---`);
	    	  	  	          	    const { ytExists } = checkTools();

	    	  	  	          	      if (!ytExists) {
	    	  	  	          	      	    console.log('⏳ Mengunduh yt-dlp...');
	    	  	  	          	      	        try {
	    	  	  	          	      	        	      const url = isWindows 
	    	  	  	          	      	        	              ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
	    	  	  	          	      	        	                      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

	    	  	  	          	      	        	                                  if (isWindows) {
	    	  	  	          	      	        	                                  	        execSync(`powershell -Command "Invoke-WebRequest -Uri ${url} -OutFile '${YTDLP_PATH}'"`);
	    	  	  	          	      	        	                                  	              } else {
	    	  	  	          	      	        	                                  	              	        execSync(`curl -L ${url} -o "${YTDLP_PATH}"`);
	    	  	  	          	      	        	                                  	              	                execSync(`chmod a+rx "${YTDLP_PATH}"`);
	    	  	  	          	      	        	                                  	              	                      }
	    	  	  	          	      	        	                                  	              	                            console.log('✅ yt-dlp berhasil diinstal.');
	    	  	  	          	      	        	                                  	              	                                } catch (e) {
	    	  	  	          	      	        	                                  	              	                                	      console.error('❌ Gagal menginstal yt-dlp. Pastikan koneksi internet stabil.');
	    	  	  	          	      	        	                                  	              	                                	          }
	    	  	  	          	      	        	                                  	              	                                	            } else {
	    	  	  	          	      	        	                                  	              	                                	            	    console.log('✅ yt-dlp sudah terpasang.');
	    	  	  	          	      	        	                                  	              	                                	            	      }

	    	  	  	          	      	        	                                  	              	                                	            	        console.log('\n📝 Catatan untuk FFmpeg:');
	    	  	  	          	      	        	                                  	              	                                	            	          console.log(`Silakan unduh ffmpeg manual dan letakkan di: ${FFMPEG_PATH}`);
	    	  	  	          	      	        	                                  	              	                                	            	          }

	    	  	  	          	      	        	                                  	              	                                	            	          async function startDownload() {
	    	  	  	          	      	        	                                  	              	                                	            	          	  const { ytExists, ffExists } = checkTools();
	    	  	  	          	      	        	                                  	              	                                	            	          	    if (!ytExists) {
	    	  	  	          	      	        	                                  	              	                                	            	          	    	    console.log('\n⚠️ Error: Jalankan menu Instalasi terlebih dahulu.');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	        return mainMenu();
	    	  	  	          	      	        	                                  	              	                                	            	          	    	          }

	    	  	  	          	      	        	                                  	              	                                	            	          	    	            const videoURL = await askQuestion('\n🔗 Masukkan Link: ');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	              console.log('\n[Format]\n1. Audio (MP3)\n2. Video (MP4)');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                const choice = await askQuestion('Pilihan: ');

	    	  	  	          	      	        	                                  	              	                                	            	          	    	                  const outputDir = path.join(process.cwd(), 'downloads');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

	    	  	  	          	      	        	                                  	              	                                	            	          	    	                      const args = choice === '1' 
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                          ? ['-x', '--audio-format', 'mp3', '--ffmpeg-location', FFMPEG_PATH, '-o', `${outputDir}/%(title)s.%(ext)s`, videoURL]
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                              : ['-f', 'mp4', '-o', `${outputDir}/%(title)s.%(ext)s`, videoURL];

	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                const download = spawn(YTDLP_PATH, args);

	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                  download.stdout.on('data', (data) => process.stdout.write(data));
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    download.on('close', (code) => {
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	    console.log(code === 0 ? `\n✅ SELESAI! Cek folder: ${outputDir}` : '\n❌ Gagal.');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	        mainMenu();
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          });
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          }

	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          async function mainMenu() {
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	  const { ytExists, ffExists } = checkTools();
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	    console.log('\n==============================');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	      console.log('       MEDIA-DL MANAGER       ');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	        console.log('==============================');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	          console.log(`OS: ${process.platform} | yt-dlp: ${ytExists ? '✅' : '❌'} | ffmpeg: ${ffExists ? '✅' : '❌'}`);
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	            console.log('------------------------------');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	              console.log('1. Download Media');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	                console.log('2. Instal/Update yt-dlp');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	                  console.log('3. Keluar');

	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	                      const menuChoice = await askQuestion('\nPilih: ');
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	                        if (menuChoice === '1') await startDownload();
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	                          else if (menuChoice === '2') { await installTools(); mainMenu(); }
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	                            else { rl.close(); process.exit(0); }
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	                            }

	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          	                            mainMenu();
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    	          }
	    	  	  	          	      	        	                                  	              	                                	            	          	    	                                    })
	    	  	  	          	      	        	                                  	              	                                	            	          	    }
	    	  	  	          	      	        	                                  	              	                                	            	          }
	    	  	  	          	      	        	                                  	              	                                	            }
	    	  	  	          	      	        	                                  	              	                                }
	    	  	  	          	      	        	                                  	              }
	    	  	  	          	      	        	                                  }
	    	  	  	          	      	        }
	    	  	  	          	      }
	    	  	  	          }
	    	  	  }
	    	  }
	    }
})
