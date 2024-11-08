/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useMemo } from 'react';

import { createMemoryHistory } from 'history';
import { find, startsWith } from 'lodash';
import { Route, Router, useHistory } from 'react-router-dom';
import styled from 'styled-components';

import AppContextProvider from '../../boot/app/app-context-provider';
import { useAppStore } from '../../store/app';
import { BoardProvider, updateBoard, useBoardStore } from '../../store/boards';
import type { Board } from '../../types/boards';
import { Modal, Typography } from '@mui/material';

const BoardContainer = styled.div<{ show: boolean }>`
	display: ${(props): string => (props.show ? 'block' : 'none')};
	height: 100%;
	width: 100%;
	overflow-y: auto;
	&::-webkit-scrollbar {
		width: 0.5rem;
	}

	&::-webkit-scrollbar-track {
		background-color: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background-color: ${({ theme }): string => theme.palette.gray3.regular};
		border-radius: 0.25rem;
	}
`;

export const AppBoard = ({ board }: { board: Board }): React.JSX.Element => {
	const current = useBoardStore((s) => s.current);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const history = useMemo(() => createMemoryHistory({ initialEntries: [board.url] }), []);
	const boardViews = useAppStore((s) => s.views.board);
	const windowHistory = useHistory();
	const route = useMemo(() => {
		const view = find(boardViews, (v) => v.id === board.url || startsWith(board.url, v.route));
		if (view)
			return (
				<Route key={view.id} path={view.route}>
					<AppContextProvider key={view.id} pkg={view.app}>
						<BoardProvider id={board.id}>
							<view.component windowHistory={windowHistory} />
						</BoardProvider>
					</AppContextProvider>
				</Route>
			);
		return null;
	}, [board.id, board.url, boardViews, windowHistory]);
	useEffect(() => {
		const unlisten = history.listen(({ location }) => {
			if (`${location.pathname}${location.search}${location.hash}` !== board.url) {
				updateBoard(board.id, { url: `${location.pathname}${location.search}${location.hash}` });
			}
		});
		return () => {
			unlisten();
		};
	}, [board.url, board.id, history]);

	useEffect(() => {
		const l = history.location;
		if (`${l.pathname}${l.search}${l.hash}` !== board.url) {
			history.push(board.url);
		}
	}, [board.url, history]);

	return (
		<BoardContainer show={current === board.id}>
			<Router history={history}>{route}</Router>
		</BoardContainer>
	);
};
