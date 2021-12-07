import { FiCalendar, FiUser } from "react-icons/fi";
import Link from 'next/Link';
import Head from 'next/Head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client'

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results)
  const [nextPage, setNextPage] = useState(postsPagination.next_page)

  const fetchData = async () => {
    if (postsPagination.next_page) {
      const response = await fetch(postsPagination.next_page).then(response => response.json())

      const data = response.results.map((post) => ({
        uid: post.uid,
        first_publication_date: post.first_publication_date,

        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }));
      setPosts([...posts, ...data]);
      setNextPage(response.next_page);
    }
  }
  return (
    <>
      <Head>
        <title>Test</title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
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
                    <span>{post.data.author}</span>
                  </div>
                </footer>
              </a>
            </Link>
          ))}
          {nextPage && <button onClick={fetchData}>Carregar mais posts</button>}
        </div>
      </main>
    </>
  )
}

export const getStaticProps = async ({
  preview = false
}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
  })

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }
  })

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page
      },
      preview
    },
  }
};
