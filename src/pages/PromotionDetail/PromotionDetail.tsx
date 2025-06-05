import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { PromotionDetailProps } from './PromotionDetail.props';
import { IPromotionDetail } from '../../interfaces/promotions.interface';
import styles from './PromotionDetail.module.scss';
import Title from '../../components/Title/Title';

const PromotionDetail = ({ ...props }: PromotionDetailProps) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState<IPromotionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getPromotionDetail = async () => {
      if (!slug) {
        navigate('/');
        return;
      }

      setLoading(true);
      try {
        const { data } = await axios.get<{ data: IPromotionDetail }>(
          `${import.meta.env.VITE_API_URL}/api/promotions/${slug}`
        );
        
        setPromotion(data.data);
        
        // Если акция истекла, показываем сообщение
        if (data.data.status === 'expired') {
          setError('Акция уже закончилась');
        }
      } catch (e) {
        const error = e as AxiosError;
        console.error('Ошибка при загрузке акции:', error.message);
        setError('Не удалось загрузить информацию об акции');
      } finally {
        setLoading(false);
      }
    };

    getPromotionDetail();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className={styles.wrapper} {...props}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper} {...props}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className={styles.wrapper} {...props}>
        <div className={styles.error}>Акция не найдена</div>
      </div>
    );
  }

  // Создаем компонент для отображения контента с изображениями
  const renderContent = (content: string) => {
    if (!content) return null;
    
    // Очищаем контент от лишних меток
    const cleanContent = content
      .replace(/Текст \d+ Фото:\s*/g, '')
      .replace(/!\s*/g, '')
      .trim();

    // Разбиваем контент на секции по заголовкам и логическим блокам
    const processContent = (text: string) => {
      const elements: React.ReactElement[] = [];
      let currentIndex = 0;

      // Регулярные выражения для различных элементов
      const headingRegex = /(?:^|\n)([А-ЯЁ][^\n]*(?:вдохновляет|выгоды|заказ|доставка|спешите|конкурсы|итог)[^\n]*?)(?=\n|$)/gim;

      // Сначала найдем все заголовки
      const headings: Array<{match: RegExpMatchArray, index: number}> = [];
      let headingMatch;
      
      while ((headingMatch = headingRegex.exec(text)) !== null) {
        headings.push({match: headingMatch, index: headingMatch.index});
      }

      // Разбиваем текст на секции
      let lastIndex = 0;
      
      headings.forEach((heading, i) => {
        // Добавляем контент перед заголовком
        if (heading.index > lastIndex) {
          const beforeContent = text.slice(lastIndex, heading.index).trim();
          if (beforeContent) {
            elements.push(...formatTextSection(beforeContent, currentIndex));
            currentIndex += 10;
          }
        }

        // Добавляем заголовок
        elements.push(
          <h2 key={`heading-${currentIndex++}`} className={styles.sectionHeading}>
            {heading.match[1].trim()}
          </h2>
        );

        // Определяем границы секции
        const nextHeadingIndex = i < headings.length - 1 ? headings[i + 1].index : text.length;
        const sectionContent = text.slice(heading.index + heading.match[0].length, nextHeadingIndex).trim();
        
        if (sectionContent) {
          elements.push(...formatTextSection(sectionContent, currentIndex));
          currentIndex += 10;
        }

        lastIndex = nextHeadingIndex;
      });

      // Если заголовков нет, форматируем весь текст как обычные секции
      if (headings.length === 0) {
        elements.push(...formatTextSection(text, currentIndex));
      }

      return elements;
    };

    // Функция для форматирования текстовых секций
    const formatTextSection = (text: string, startIndex: number): React.ReactElement[] => {
      const elements: React.ReactElement[] = [];
      let index = startIndex;

      // Разбиваем на абзацы
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
      
      paragraphs.forEach(paragraph => {
        const trimmedParagraph = paragraph.trim();
        if (!trimmedParagraph) return;

        // Проверяем, содержит ли параграф список
        if (trimmedParagraph.includes('        ') && trimmedParagraph.includes('.')) {
          // Это блок со списком (например, "Смартфоны и планшеты. ...")
          const parts = trimmedParagraph.split(/\n\s*\n/);
          
          parts.forEach(part => {
            const cleanPart = part.replace(/\s+/g, ' ').trim();
            
            if (cleanPart.match(/^[А-ЯЁ][^.]*\./)) {
              // Это заголовок пункта списка
              const [title, ...description] = cleanPart.split('.');
              elements.push(
                <div key={`list-item-${index++}`} className={styles.listItem}>
                  <h3 className={styles.listTitle}>{title.trim()}</h3>
                  {description.length > 0 && (
                    <p className={styles.listDescription}>
                      {description.join('.').trim()}
                    </p>
                  )}
                </div>
              );
            } else {
              elements.push(
                <p key={`paragraph-${index++}`} className={styles.paragraph}>
                  {cleanPart}
                </p>
              );
            }
          });
        } else {
          // Обычный параграф
          const cleanParagraph = trimmedParagraph.replace(/\s+/g, ' ');
          
          // Проверяем, не является ли это вступительным абзацем
          if (cleanParagraph.length > 200 && cleanParagraph.includes('летом') && index < 5) {
            elements.push(
              <p key={`intro-${index++}`} className={styles.introText}>
                {cleanParagraph}
              </p>
            );
          } else {
            elements.push(
              <p key={`paragraph-${index++}`} className={styles.paragraph}>
                {cleanParagraph}
              </p>
            );
          }
        }
      });

      return elements;
    };

    return (
      <div className={styles.formattedContent}>
        {processContent(cleanContent)}
      </div>
    );
  };

  return (
    <div className={styles.wrapper} {...props}>
      <div className={styles.promotionHeader}>
        <Title className={styles.title}>{promotion.title}</Title>
        
        {promotion.start_date && promotion.end_date && (
          <div className={styles.period}>
            Срок акции: {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
          </div>
        )}
      </div>
      
      {promotion.preview_image && (
        <div className={styles.imageContainer}>
          <img 
            src={`${import.meta.env.VITE_API_URL}${promotion.preview_image}`}
            alt={promotion.title}
            className={styles.image}
          />
        </div>
      )}
      
      {promotion.content && (
        <div 
          className={styles.content}
        >
          {renderContent(promotion.content)}
        </div>
      )}
      
      {promotion.preview_text && !promotion.content && (
        <div className={styles.content}>
          <p>{promotion.preview_text}</p>
        </div>
      )}
    </div>
  );
};

export default PromotionDetail; 