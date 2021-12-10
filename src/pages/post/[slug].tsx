import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router'
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';


import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client'
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom'

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter()
  if (router.isFallback) {
    return <div>Carregando...</div>
  }


  const estimatedReadTime = () => (
    post?.data.content.reduce((acc, content) => {
      const text = `${content.heading} ${RichText.asText(content.body)}`
      return Math.ceil(text.split(' ').length / 150)
    }, 0)
  )

  return (
    <>
      <Head>
        <title>{post?.data.title} | Ignews</title>
      </Head>
      <main className={commonStyles.container}>
        <img src={post?.data.banner.url} alt="banner url" />
        <article className={styles.post}>
          <h1>{post?.data.title}</h1>
          <footer>
            <div>
              <FiCalendar size={20} color="#FFF"></FiCalendar>
              <time>{format(
                new Date(post.first_publication_date),
                'dd MMM yyyy',
                {
                  locale: ptBR,
                }
              )}</time>
            </div>
            <div>
              <FiUser size={20} color="#FFF"></FiUser>
              <span>{post?.data.author}</span>
            </div>
            <div>
              <FiClock size={20} color="#FFF"></FiClock>
              <span>{estimatedReadTime()} min</span>
            </div>
          </footer>
          {post?.data.content.map(content => {
            return (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  className={styles.postContent}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            );
          })}

        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], /* {
      fetch: ['posts.title', 'posts.content'],
      pageSize: 2,
    } */)

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    }
  }


  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  }
};
